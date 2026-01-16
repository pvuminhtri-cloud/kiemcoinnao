(function () {
    'use strict';

    // ============================================
    // XSS Prevention Helper
    // ============================================
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

    // ============================================
    // General Dashboard (tongquat.html) Stats
    // ============================================
    function initGeneralDashboard() {
        // Only run on the general dashboard page
        if (!document.getElementById('stats-total-users')) return;

        const totalUsersEl = document.getElementById('stats-total-users');
        const onlineUsersEl = document.getElementById('stats-online-users');
        const totalPaidEl = document.getElementById('stats-total-paid');
        const pendingWithdrawalsEl = document.getElementById('stats-pending-withdrawals');

        function updateStats() {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const userList = Object.values(users);

            // 1. Total Users
            const totalUsers = userList.length;
            if (totalUsersEl) totalUsersEl.textContent = totalUsers.toLocaleString();

            // 2. Financial Stats
            let totalPaid = 0;
            let pendingCount = 0;

            userList.forEach(user => {
                if (user.withdrawalHistory) {
                    user.withdrawalHistory.forEach(tx => {
                        if (tx.status === 'completed') {
                            totalPaid += (tx.amount || 0);
                        } else if (tx.status === 'pending') {
                            pendingCount++;
                        }
                    });
                }
            });

            if (totalPaidEl) totalPaidEl.textContent = totalPaid.toLocaleString() + ' Coin';
            if (pendingWithdrawalsEl) pendingWithdrawalsEl.textContent = pendingCount.toLocaleString() + ' Đơn';

            // 3. Online Users (Data from synced users)
            if (onlineUsersEl) {
                const onlineCount = totalUsers > 0 ? totalUsers : 1;
                onlineUsersEl.textContent = onlineCount.toLocaleString();
            }
        }

        // Initial update
        updateStats();

        // 3. Popular Tasks Ranking
        const popularTasksList = document.getElementById('popular-tasks-list');
        if (popularTasksList) {
            function updatePopularTasks() {
                const users = JSON.parse(localStorage.getItem('users') || '{}');
                const taskCounts = {};
                let totalCompleted = 0;

                // Aggregating task performance across all users
                Object.values(users).forEach(user => {
                    if (user.taskHistory) {
                        user.taskHistory.forEach(task => {
                            if (task.status === 'success') {
                                const name = task.taskName || 'Nhiệm vụ không tên';
                                taskCounts[name] = (taskCounts[name] || 0) + 1;
                                totalCompleted++;
                            }
                        });
                    }
                });

                // Convert to array and sort by count desc
                const sortedTasks = Object.entries(taskCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5); // Show top 5

                if (sortedTasks.length === 0) {
                    popularTasksList.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.5;">Chưa có dữ liệu hoàn thành nhiệm vụ</div>';
                    return;
                }

                popularTasksList.innerHTML = '';
                const colors = ['cyan', 'magenta', 'purple', 'emerald', 'gold'];

                sortedTasks.forEach(([name, count], index) => {
                    const percentage = totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0;
                    const color = colors[index % colors.length];

                    const item = document.createElement('div');
                    item.className = 'progress-item';
                    item.innerHTML = `
                        <div class="progress-header">
                            <span class="progress-label">${name}</span>
                            <span class="progress-value">${count} lượt (${percentage}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${color}" style="width: ${percentage}%"></div>
                        </div>
                    `;
                    popularTasksList.appendChild(item);
                });
            }
            updatePopularTasks();
        }

        // Auto Refresh
        setInterval(() => {
            updateStats();
            updatePopularTasks();
        }, 5000);
    }

    // ============================================
    // Admin Withdrawal Management
    // ============================================
    function initAdminWithdrawalManagement() {
        const tbody = document.getElementById('admin-withdrawals-body');
        if (!tbody) return;

        function renderRequests() {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            tbody.innerHTML = '';
            let hasRequests = false;

            Object.keys(users).forEach(username => {
                const user = users[username];
                if (user.withdrawalHistory) {
                    user.withdrawalHistory.forEach((tx, index) => {
                        if (tx.status === 'pending') {
                            hasRequests = true;
                            const date = new Date(tx.timestamp);
                            const dateStr = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>
                                    <div style="font-weight: 600;">${username}</div>
                                    <div style="font-size: 12px; opacity: 0.7;">${user.email || ''}</div>
                                </td>
                                <td><span class="amount" style="color: var(--gold); font-weight: 700;">${tx.amount.toLocaleString()} Coin</span></td>
                                <td>
                                    <div style="font-size: 13px;">${tx.method || 'N/A'}</div>
                                    <div style="font-size: 12px; opacity: 0.7;">${user.bankAccount || 'Chưa cập nhật'}</div>
                                    <div style="font-size: 11px; opacity: 0.6;">${user.bankOwnerName || ''}</div>
                                </td>
                                <td><span style="font-size: 12px;">${dateStr}</span></td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn-approve" style="background: var(--success); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Duyệt</button>
                                        <button class="btn-reject" style="background: var(--coral); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Từ Chối</button>
                                    </div>
                                </td>
                            `;

                            tr.querySelector('.btn-approve').onclick = () => handleAction(username, index, 'completed');
                            tr.querySelector('.btn-reject').onclick = () => handleAction(username, index, 'rejected');

                            tbody.appendChild(tr);
                        }
                    });
                }
            });

            if (!hasRequests) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.5);">Không có yêu cầu rút tiền nào đang chờ</td></tr>';
            }
        }

        function handleAction(username, txIndex, newStatus) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            if (!user || !user.withdrawalHistory[txIndex]) return;

            const tx = user.withdrawalHistory[txIndex];

            if (newStatus === 'rejected') {
                user.balance = (user.balance || 0) + tx.amount;
                alert(`Đã từ chối yêu cầu và hoàn trả ${(tx.amount).toLocaleString()} Coin cho ${username}`);
            } else {
                alert(`Đã duyệt thành công ${(tx.amount).toLocaleString()} Coin cho ${username}`);
            }

            tx.status = newStatus;
            tx.processedAt = new Date().toISOString();

            localStorage.setItem('users', JSON.stringify(users));
            renderRequests();

            // Refresh stats if function exists
            initGeneralDashboard();
        }

        renderRequests();
        setInterval(renderRequests, 5000);
    }

    // ============================================
    // Admin User Management
    // ============================================
    function checkSecurityAnomalies() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const ipCounts = {};
        const bankCounts = {};

        Object.keys(users).forEach(username => {
            const user = users[username];
            if (user.status === 'banned') return;

            if (user.lastIP && user.lastIP !== 'N/A') {
                ipCounts[user.lastIP] = (ipCounts[user.lastIP] || 0) + 1;
            }
            if (user.bankAccount) {
                bankCounts[user.bankAccount] = (bankCounts[user.bankAccount] || 0) + 1;
            }
        });

        let hasChanges = false;
        Object.keys(users).forEach(username => {
            const user = users[username];
            if (user.status !== 'normal') return;

            const isDuplicateIP = user.lastIP && ipCounts[user.lastIP] > 1;
            const isDuplicateBank = user.bankAccount && bankCounts[user.bankAccount] > 1;

            if (isDuplicateIP || isDuplicateBank) {
                user.status = 'suspicious';
                user.fraudReason = isDuplicateIP ? 'Trùng IP' : 'Trùng Ngân hàng';
                hasChanges = true;
            }
        });

        if (hasChanges) {
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    function initAdminUserManagement() {
        const tbody = document.getElementById('admin-users-body');
        if (!tbody) return;

        checkSecurityAnomalies();

        const tabs = document.querySelectorAll('.user-tab');
        const searchInput = document.getElementById('user-search');
        let currentFilter = 'all';

        function renderUsers() {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const searchText = searchInput ? searchInput.value.toLowerCase() : '';
            tbody.innerHTML = '';

            Object.keys(users).forEach(username => {
                const user = users[username];
                const status = user.status || 'normal';

                if (currentFilter !== 'all' && status !== currentFilter) return;
                if (searchText && !username.toLowerCase().includes(searchText)) return;

                const date = new Date(user.createdAt || Date.now());
                const dateStr = date.toLocaleDateString('vi-VN');

                const totalWithdrawn = (user.withdrawalHistory || [])
                    .filter(tx => tx.status === 'completed')
                    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

                let statusLabel = 'Bình thường';
                let statusClass = 'status-normal';
                if (status === 'suspicious') {
                    statusLabel = user.fraudReason ? `Nghi ngờ (${user.fraudReason})` : 'Nghi ngờ';
                    statusClass = 'status-suspicious';
                }
                if (status === 'banned') { statusLabel = 'Bị ban'; statusClass = 'status-banned'; }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div style="font-weight: 600;">${escapeHtml(user.email || user.phone || 'N/A')}</div>
                        <div style="font-size: 11px; opacity: 0.7;">Username: ${escapeHtml(username)}</div>
                    </td>
                    <td><span style="font-weight: 600;">${(user.balance || 0).toLocaleString()}</span></td>
                    <td><span style="color: var(--gold); font-weight: 600;">${totalWithdrawn.toLocaleString()}</span></td>
                    <td>
                        <div style="font-size: 13px; font-weight: 500;">${escapeHtml(user.bankName || 'N/A')}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${escapeHtml(user.bankAccount || '')}</div>
                        <div style="font-size: 11px; font-style: italic; opacity: 0.6;">${escapeHtml(user.bankAccountName || '')}</div>
                    </td>
                    <td><span style="font-size: 12px; font-family: 'Space Mono'; opacity: 0.8;">${escapeHtml(user.lastIP || 'N/A')}</span></td>
                    <td><span class="status-badge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
                    <td><span style="font-size: 12px;">${dateStr}</span></td>
                    <td>
                        <div class="action-btns">
                            ${status !== 'normal' ? `<button class="action-btn btn-normal" title="Đặt về bình thường">Gỡ</button>` : ''}
                            ${status !== 'suspicious' ? `<button class="action-btn btn-warn" title="Đánh dấu nghi ngờ">⚠</button>` : ''}
                            ${status !== 'banned' ? `<button class="action-btn btn-ban" title="Khóa tài khoản">Ban</button>` : ''}
                            <button class="action-btn btn-edit" title="Đổi mật khẩu">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="action-btn btn-delete" title="Xóa vĩnh viễn" style="background: rgba(239, 68, 68, 0.4); border: 1px solid #ef4444;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;

                if (tr.querySelector('.btn-normal')) tr.querySelector('.btn-normal').onclick = () => updateStatus(username, 'normal');
                if (tr.querySelector('.btn-warn')) tr.querySelector('.btn-warn').onclick = () => updateStatus(username, 'suspicious');
                if (tr.querySelector('.btn-ban')) tr.querySelector('.btn-ban').onclick = () => updateStatus(username, 'banned');
                if (tr.querySelector('.btn-edit')) tr.querySelector('.btn-edit').onclick = () => openPasswordModal(username);
                if (tr.querySelector('.btn-delete')) tr.querySelector('.btn-delete').onclick = () => deleteUser(username);

                tbody.appendChild(tr);
            });
        }

        let editingUsername = null;

        function openPasswordModal(username) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[username];
            if (!user) return;

            editingUsername = username;
            const modal = document.getElementById('passwordEditModal');
            const title = document.getElementById('modal-username');
            const currentPass = document.getElementById('current-password-display');
            const newPassInput = document.getElementById('new-password-input');

            if (modal && title && newPassInput) {
                title.textContent = `Đổi Mật Khẩu: ${escapeHtml(username)}`;
                // Password is now hashed, don't display it
                if (currentPass) {
                    currentPass.value = '[Mật khẩu đã được mã hóa]';
                    currentPass.disabled = true;
                }
                newPassInput.value = '';
                modal.style.display = 'flex';

                // Add save handler
                const saveBtn = document.getElementById('btn-update-password');
                if (saveBtn) {
                    saveBtn.onclick = () => saveUserPassword();
                }
            }
        }

        window.closePasswordModal = function () {
            const modal = document.getElementById('passwordEditModal');
            if (modal) modal.style.display = 'none';
            editingUsername = null;
        };

        function saveUserPassword() {
            if (!editingUsername) return;

            const newPassInput = document.getElementById('new-password-input');
            const newPassword = newPassInput ? newPassInput.value.trim() : '';

            if (!newPassword) {
                alert('Vui lòng nhập mật khẩu mới!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[editingUsername]) {
                users[editingUsername].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));

                if (window.showNotification) {
                    window.showNotification(`Đã cập nhật mật khẩu cho ${editingUsername}`, 'success');
                } else {
                    alert('Cập nhật mật khẩu thành công!');
                }

                closePasswordModal();
            }
        }

        function deleteUser(username) {
            if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản ${username}? Hành động này không thể hoàn tác!`)) return;

            const users = JSON.parse(localStorage.getItem('users') || '{}');
            delete users[username];
            localStorage.setItem('users', JSON.stringify(users));

            if (window.showNotification) window.showNotification(`Đã xóa tài khoản ${username}`, 'success');
            renderUsers();
            initGeneralDashboard();
        }

        function updateStatus(username, newStatus) {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (users[username]) {
                users[username].status = newStatus;
                localStorage.setItem('users', JSON.stringify(users));
                renderUsers();
            }
        }

        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.status;
                renderUsers();
            };
        });

        if (searchInput) {
            searchInput.oninput = renderUsers;
        }

        const syncBtn = document.getElementById('sync-users-btn');
        if (syncBtn) {
            syncBtn.onclick = () => syncUsersFromWeb();
        }

        renderUsers();
        setInterval(() => {
            checkSecurityAnomalies();
            renderUsers();
        }, 5000);
    }

    async function syncUsersFromWeb() {
        const url = prompt('Nhập URL JSON người dùng để đồng bộ (hoặc để trống để làm mới):');
        if (url === null) return;

        if (!url.trim()) {
            checkSecurityAnomalies();
            location.reload();
            return;
        }

        try {
            if (window.showNotification) window.showNotification('Đang đồng bộ data...', 'info');
            const response = await fetch(url);
            if (!response.ok) throw new Error('Không thể fetch dữ liệu');

            const remoteUsers = await response.json();
            const localUsers = JSON.parse(localStorage.getItem('users') || '{}');

            const merged = { ...localUsers, ...remoteUsers };
            localStorage.setItem('users', JSON.stringify(merged));

            if (window.showNotification) window.showNotification('Đồng bộ thành công!', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            alert('Lỗi đồng bộ: ' + error.message);
        }
    }

    // ============================================
    // Initialization
    // ============================================
    function init() {
        initGeneralDashboard();
        initAdminWithdrawalManagement();
        initAdminUserManagement();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
