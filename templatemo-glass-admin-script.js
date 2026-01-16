(function () {
    'use strict';

    const API_BASE_URL = 'http://127.0.0.1:3000/api';

    // ============================================
    // Theme Toggle
    // ============================================
    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const iconSun = themeToggle.querySelector('.icon-sun');
        const iconMoon = themeToggle.querySelector('.icon-moon');

        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);

            if (iconSun && iconMoon) {
                if (theme === 'light') {
                    iconSun.style.display = 'none';
                    iconMoon.style.display = 'block';
                } else {
                    iconSun.style.display = 'block';
                    iconMoon.style.display = 'none';
                }
            }
        }

        // Check for saved theme preference or default to dark
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // ============================================
    // 3D Tilt Effect
    // ============================================
    function initTiltEffect() {
        document.querySelectorAll('.glass-card-3d').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            });
        });
    }

    // ============================================
    // Animated Counters
    // ============================================
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            if (element.dataset.prefix) {
                element.textContent = element.dataset.prefix + current.toLocaleString() + (element.dataset.suffix || '');
            } else {
                element.textContent = current.toLocaleString() + (element.dataset.suffix || '');
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    function initCounters() {
        const counters = document.querySelectorAll('.stat-value');
        counters.forEach(counter => {
            const text = counter.textContent;
            const value = parseInt(text.replace(/[^0-9]/g, ''));

            if (text.includes('$')) {
                counter.dataset.prefix = '$';
            }
            if (text.includes('%')) {
                counter.dataset.suffix = '%';
            }

            // Skip animation if the value is not a number
            if (isNaN(value)) {
                return;
            }

            animateCounter(counter, value);
        });
    }

    // ============================================
    // Mobile Menu Toggle
    // ============================================
    function initMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') &&
                    !sidebar.contains(e.target) &&
                    !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }

    function initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate]');

        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                let isValid = true;
                const inputs = form.querySelectorAll('.form-input[required]');

                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.style.borderColor = '#ff6b6b';
                    } else {
                        input.style.borderColor = '';
                    }
                });

                // Name validation (for register page)
                const lastnameInput = form.querySelector('#lastname');
                const firstnameInput = form.querySelector('#firstname');

                if (lastnameInput && firstnameInput) {
                    if (!lastnameInput.value.trim()) {
                        isValid = false;
                        lastnameInput.style.borderColor = '#ff6b6b';
                    }
                    if (!firstnameInput.value.trim()) {
                        isValid = false;
                        firstnameInput.style.borderColor = '#ff6b6b';
                    }
                }

                // Password validation (for register page)
                const passwordInput = form.querySelector('#password');
                if (passwordInput && passwordInput.value) {
                    const password = passwordInput.value;
                    // Check if password contains at least one digit
                    const hasNumber = /\d/.test(password);
                    if (!hasNumber) {
                        isValid = false;
                        passwordInput.style.borderColor = '#ff6b6b';
                    }
                    // Length already checked by HTML5 minlength
                }

                // Confirm password validation (for register page)
                const confirmPasswordInput = form.querySelector('#confirm-password');
                if (confirmPasswordInput && confirmPasswordInput.value) {
                    if (passwordInput && confirmPasswordInput.value !== passwordInput.value) {
                        isValid = false;
                        confirmPasswordInput.style.borderColor = '#ff6b6b';
                    }
                }


                // Email validation
                const emailInput = form.querySelector('#email');
                if (emailInput && emailInput.value) {
                    const value = emailInput.value.trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                    if (!emailRegex.test(value)) {
                        isValid = false;
                        emailInput.style.borderColor = '#ff6b6b';
                    }
                }

                if (isValid) {
                    // Check if this is registration or login form
                    const isRegisterForm = form.querySelector('#confirm-password') !== null;
                    const isLoginForm = !isRegisterForm && passwordInput !== null;

                    if (isRegisterForm || isLoginForm) {
                        // Show loading state if needed
                        const submitBtn = form.querySelector('button[type="submit"]');
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.textContent = 'Đang xử lý...';
                        }

                        // Get IP before submitting
                        fetch('https://api.ipify.org?format=json')
                            .then(r => r.json())
                            .then(data => proceedWithForm(data.ip))
                            .catch(() => proceedWithForm('N/A'));

                        function proceedWithForm(userIP) {
                            (async () => {
                                if (isRegisterForm) {
                                    // Registration logic - only email allowed
                                    const email = emailInput.value.trim();

                                    // Validate email format
                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                    if (!emailRegex.test(email)) {
                                        alert('Vui lòng nhập email hợp lệ');
                                        if (submitBtn) {
                                            submitBtn.disabled = false;
                                            submitBtn.textContent = 'Hoàn tất Đăng ký';
                                        }
                                        return;
                                    }

                                    // Auto-generate username from email prefix
                                    const username = email.split('@')[0];
                                    const password = passwordInput.value;

                                    // Get referral code from URL if exists
                                    const urlParams = new URLSearchParams(window.location.search);
                                    const referralCode = urlParams.get('ref');

                                    try {
                                        const result = await createUserAccount(username, email, '', password, userIP, referralCode);

                                        if (result.success) {
                                            // Auto login after registration
                                            await loginUser(username, password, userIP);

                                            // Show success UI instead of alert
                                            const successUI = document.getElementById('registration-success');
                                            const formEl = document.getElementById('register-form');
                                            const headerEl = form.closest('.login-card').querySelector('.login-header');

                                            if (successUI && formEl) {
                                                formEl.style.display = 'none';
                                                if (headerEl) headerEl.style.display = 'none';
                                                successUI.style.display = 'block';

                                                setTimeout(() => {
                                                    window.location.href = 'index.html';
                                                }, 2000);
                                            } else {
                                                alert(result.message);
                                                window.location.href = 'index.html';
                                            }
                                        } else {
                                            alert(result.message);
                                            if (submitBtn) {
                                                submitBtn.disabled = false;
                                                submitBtn.textContent = 'Hoàn tất Đăng ký';
                                            }
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert('Đã xảy ra lỗi kết nối');
                                        if (submitBtn) {
                                            submitBtn.disabled = false;
                                            submitBtn.textContent = 'Hoàn tất Đăng ký';
                                        }
                                    }
                                } else if (isLoginForm) {
                                    // Login logic
                                    const emailOrUsername = emailInput.value.trim();
                                    const password = passwordInput.value;

                                    try {
                                        const result = await loginUser(emailOrUsername, password, userIP);

                                        if (result.success) {
                                            // Silent login - redirect immediately without alert
                                            if (result.isAdmin) {
                                                window.location.href = 'admin/tongquat.html';
                                            } else {
                                                window.location.href = 'index.html';
                                            }
                                        } else {
                                            alert(result.message);
                                            emailInput.style.borderColor = '#ff6b6b';
                                            passwordInput.style.borderColor = '#ff6b6b';
                                            if (submitBtn) {
                                                submitBtn.disabled = false;
                                                submitBtn.textContent = 'Đăng nhập';
                                            }
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert('Đã xảy ra lỗi kết nối');
                                        if (submitBtn) {
                                            submitBtn.disabled = false;
                                            submitBtn.textContent = 'Đăng nhập';
                                        }
                                    }
                                }
                            })();
                        }
                    } else {
                        // Other forms - original behavior
                        console.log('Form is valid');
                        if (form.dataset.redirect) {
                            window.location.href = form.dataset.redirect;
                        }
                    }
                }
            });
        });
    }

    // ============================================
    // Password Visibility Toggle
    // ============================================
    function initPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');

        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.parentElement.querySelector('input');
                const icon = button.querySelector('svg');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
                } else {
                    input.type = 'password';
                    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
                }
            });
        });
    }

    // ============================================
    // Smooth Page Transitions
    // ============================================
    function initPageTransitions() {
        const links = document.querySelectorAll('a[href$=".html"]');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // Skip external links
                if (link.hostname !== window.location.hostname) return;

                e.preventDefault();
                const href = link.getAttribute('href');

                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';

                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        });

        // Fade in on page load
        window.addEventListener('load', () => {
            document.body.style.opacity = '1';
        });
    }

    // ============================================
    // Settings Tab Navigation
    // ============================================
    function initSettingsTabs() {
        const tabLinks = document.querySelectorAll('.settings-nav-link[data-tab]');

        if (tabLinks.length === 0) return;

        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Get target tab
                const tabId = link.getAttribute('data-tab');

                // Remove active class from all nav links
                document.querySelectorAll('.settings-nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });

                // Add active class to clicked link
                link.classList.add('active');

                // Hide all tab contents
                document.querySelectorAll('.settings-tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });

                // Show target tab content
                const targetTab = document.getElementById('tab-' + tabId);
                if (targetTab) {
                    targetTab.classList.add('active');
                }
            });
        });

        // Theme select sync with toggle
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            const currentTheme = localStorage.getItem('theme') || 'dark';
            themeSelect.value = currentTheme;

            themeSelect.addEventListener('change', () => {
                const theme = themeSelect.value;
                if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', theme);
                    localStorage.setItem('theme', theme);
                }

                // Update theme toggle icons
                const iconSun = document.querySelector('#theme-toggle .icon-sun');
                const iconMoon = document.querySelector('#theme-toggle .icon-moon');
                if (iconSun && iconMoon) {
                    const effectiveTheme = document.documentElement.getAttribute('data-theme');
                    if (effectiveTheme === 'light') {
                        iconSun.style.display = 'none';
                        iconMoon.style.display = 'block';
                    } else {
                        iconSun.style.display = 'block';
                        iconMoon.style.display = 'none';
                    }
                }
            });
        }
    }

    // ============================================
    // User Account Management
    // ============================================
    async function createUserAccount(username, email, phone, password, ip = 'N/A', referralCode = null) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    phone,
                    password,
                    ip,
                    referralCode
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Lỗi kết nối đến máy chủ' };
        }
    }

    async function loginUser(emailOrUsername, password, ip = 'N/A') {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: emailOrUsername, password, ip })
            });

            const result = await response.json();

            if (result.success && result.user) {
                // Store JWT token securely
                if (result.token) {
                    localStorage.setItem('authToken', result.token);
                }

                // Update Local Storage Cache
                const users = JSON.parse(localStorage.getItem('users') || '{}');
                users[result.user.username] = result.user;

                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('currentUser', result.user.username);
            }

            return result;
        } catch (error) {
            console.error('Login Error Details:', error);
            return {
                success: false,
                message: `Lỗi kết nối: ${error.message}. Vui lòng kiểm tra xem server đã bật chưa (npm run dev).`
            };
        }
    }

    function getCurrentUser() {
        const username = localStorage.getItem('currentUser');
        if (!username) return null;

        const users = JSON.parse(localStorage.getItem('users') || '{}');
        return users[username] || null;
    }

    async function updateUserData(updates) {
        const username = localStorage.getItem('currentUser');
        const token = localStorage.getItem('authToken');
        if (!username) return { success: false, message: 'Chưa đăng nhập' };

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/users/${username}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(updates)
            });
            const result = await response.json();

            // Handle token expiration
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
                return { success: false, message: 'Phiên đăng nhập hết hạn' };
            }

            if (result.success) {
                // If username changed, update token and currentUser
                if (result.token && result.newUsername) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('currentUser', result.newUsername);
                }

                // Update Local Cache
                const users = JSON.parse(localStorage.getItem('users') || '{}');
                if (users[username]) {
                    if (updates.username && updates.username !== username) {
                        users[updates.username] = { ...users[username], ...updates };
                        delete users[username];
                        if (!result.newUsername) {
                            // Fallback if server didn't return newUsername
                            localStorage.setItem('currentUser', updates.username);
                        }
                    } else {
                        users[username] = { ...users[username], ...updates };
                    }
                    localStorage.setItem('users', JSON.stringify(users));
                }
            }
            return result;
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Lỗi kết nối' };
        }
    }

    // Expose shared functions to window for admin logic.js
    window.showNotification = showNotification;
    window.updateUserData = updateUserData;
    window.getCurrentUser = getCurrentUser;

    function updateDashboardStats() {
        const user = getCurrentUser();
        if (!user) return;

        // Update global dashboard balance if present
        const balanceElement = document.querySelector('.balance-card .count');
        if (balanceElement) {
            balanceElement.textContent = (user.balance || 0).toLocaleString() + ' Coin';
        }

        // Update stat values on dashboard (index.html)
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 4) {
            statValues[0].textContent = (user.balance || 0).toLocaleString() + ' Coin';
            statValues[1].textContent = user.rank || 'Rank Đồng';
            statValues[2].textContent = (user.tasksCompleted || 0).toLocaleString();
            statValues[3].textContent = (user.referrals || 0).toLocaleString();
        }

        // Update withdrawal page specific stats
        const withdrawBalance = document.getElementById('withdraw-balance');
        const withdrawPending = document.getElementById('withdraw-pending');
        const withdrawTotal = document.getElementById('withdraw-total');

        if (withdrawBalance) {
            withdrawBalance.textContent = (user.balance || 0).toLocaleString() + ' Coin';
        }

        if (withdrawPending || withdrawTotal) {
            const history = user.withdrawalHistory || [];
            const pending = history.filter(h => h.status === 'pending').reduce((sum, h) => sum + h.amount, 0);
            const total = history.filter(h => h.status === 'completed').reduce((sum, h) => sum + h.amount, 0);

            if (withdrawPending) withdrawPending.textContent = pending.toLocaleString() + ' Coin';
            if (withdrawTotal) withdrawTotal.textContent = total.toLocaleString() + ' Coin';
        }
    }
    /**
     * Checks if the day has changed and resets daily task counts if needed.
     */
    function checkAndResetDailyTasks(user) {
        const today = new Date().toLocaleDateString();
        if (user.lastAccessDate !== today) {
            user.lastAccessDate = today;
            user.dailyTasks = {}; // Reset counts for all tasks
            updateUserData(user);
        }
    }

    // ============================================
    // Server Health Check
    // ============================================
    async function checkServerConnection() {
        const loginPage = document.querySelector('.login-page');
        if (!loginPage) return; // Only run on login page

        try {
            // Try to fetch root which returns "API is running..."
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

            const response = await fetch('http://127.0.0.1:3000/', {
                signal: controller.signal,
                mode: 'no-cors' // Use no-cors to at least check if server is reachable
            });
            clearTimeout(timeoutId);

            // If we get here (even with opaque response in no-cors), server is likely up
            showServerStatus(true, 'Đã kết nối máy chủ');
        } catch (error) {
            console.error('Server check failed:', error);
            showServerStatus(false, 'Không thể kết nối máy chủ');
        }
    }

    function showServerStatus(isOnline, message) {
        let statusEl = document.getElementById('server-status');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'server-status';
            statusEl.style.position = 'absolute';
            statusEl.style.top = '10px';
            statusEl.style.right = '10px';
            statusEl.style.padding = '5px 10px';
            statusEl.style.borderRadius = '20px';
            statusEl.style.fontSize = '12px';
            statusEl.style.fontWeight = 'bold';
            statusEl.style.transition = 'all 0.3s ease';
            document.querySelector('.login-page').appendChild(statusEl);
        }

        if (isOnline) {
            statusEl.style.background = 'rgba(0, 255, 0, 0.2)';
            statusEl.style.color = '#00ff00';
            statusEl.innerHTML = `<span style="display:inline-block;width:8px;height:8px;background:#00ff00;border-radius:50%;margin-right:5px;"></span> ${message}`;
        } else {
            statusEl.style.background = 'rgba(255, 0, 0, 0.2)';
            statusEl.style.color = '#ff4444';
            statusEl.innerHTML = `<span style="display:inline-block;width:8px;height:8px;background:#ff4444;border-radius:50%;margin-right:5px;"></span> ${message}`;
        }
    }

    // Initialize health check
    if (document.querySelector('.login-page')) {
        checkServerConnection();
    }

    // ============================================
    // Task & Shortlink Management
    // ============================================

    function initTaskButtons() {
        const taskButtons = document.querySelectorAll('.task-button');
        const user = getCurrentUser();
        if (!user) return;

        checkAndResetDailyTasks(user);

        taskButtons.forEach(button => {
            const card = button.closest('.task-card');
            const taskId = card.dataset.taskId;
            const maxTurns = parseInt(card.dataset.maxTurns);
            const turnsDone = (user.dailyTasks && user.dailyTasks[taskId]) || 0;
            const turnsRemaining = Math.max(0, maxTurns - turnsDone);

            // Update UI reflect turns
            const viewsBadge = card.querySelector('.badge-views');
            if (viewsBadge) {
                viewsBadge.textContent = `${turnsRemaining} / ${maxTurns} lượt`;
            }

            if (turnsRemaining <= 0) {
                card.style.display = 'none'; // Hide task card if no turns left
                return;
            }

            // Check if this task is pending accurately
            const pendingTaskStr = localStorage.getItem('pendingTask');
            let isCurrentTaskPending = false;
            let pendingData = null;

            if (pendingTaskStr) {
                pendingData = JSON.parse(pendingTaskStr);
                const elapsedTime = Date.now() - pendingData.timestamp;
                const tenMinutes = 10 * 60 * 1000;

                if (pendingData.taskId === taskId && elapsedTime < tenMinutes) {
                    isCurrentTaskPending = true;
                    button.textContent = 'Tiếp tục';
                    button.classList.add('btn-continue');

                    // Set timeout for automatic reversion
                    const remainingTime = tenMinutes - elapsedTime;
                    setTimeout(() => {
                        button.textContent = 'Tiến Hành';
                        button.classList.remove('btn-continue');
                        isCurrentTaskPending = false;
                        // Also clear pending task if it's the current one
                        const currentPending = JSON.parse(localStorage.getItem('pendingTask') || '{}');
                        if (currentPending.taskId === taskId) {
                            localStorage.removeItem('pendingTask');
                        }
                    }, remainingTime);
                }
            }

            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const taskNameElement = card.querySelector('.task-name');
                const taskName = taskNameElement ? taskNameElement.textContent.trim() : 'Nhiệm vụ';
                const rewardText = card.querySelector('.badge-reward').textContent;
                const reward = parseInt(rewardText.replace(/[^0-9]/g, ''));

                // Map taskId to network name
                const taskIdToNetwork = {
                    'traffictot': 'traffictot',
                    'uptolink-2-steps': 'uptolink',
                    'uptolink-3-steps': 'uptolink2',
                    'click1s': 'click1s',
                    'layma': 'layma',
                    'site2s': 'site2s',
                    'bbmkts': 'bbmkts'
                };

                const networkName = taskIdToNetwork[taskId] || 'traffictot';

                // Check if user has remaining turns
                if (turnsRemaining <= 0) {
                    alert('Bạn đã hết lượt cho nhiệm vụ này hôm nay!');
                    return;
                }

                // If task is already pending, just show modal
                if (isCurrentTaskPending && pendingData && pendingData.shortUrl) {
                    showLinkModal(pendingData.shortUrl, pendingData.taskName, pendingData.timestamp);
                    return;
                }

                // Show loading state
                const originalText = button.textContent;
                button.textContent = 'Đang xử lý...';
                button.disabled = true;

                // Generate a verification key
                const verificationKey = Math.random().toString(36).substring(2, 15);

                // Create return URL with reward info and key
                const returnUrl = `${API_CONFIG.appUrl}?status=success&reward=${reward}&task=${encodeURIComponent(taskName)}&taskId=${taskId}&key=${verificationKey}`;

                // Shorten link using the appropriate network
                const shortUrl = await shortenUrl(returnUrl, networkName);

                if (shortUrl) {
                    // Save pending task with shortUrl and taskName for persistence
                    localStorage.setItem('pendingTask', JSON.stringify({
                        taskId: taskId,
                        taskName: taskName,
                        shortUrl: shortUrl,
                        key: verificationKey,
                        timestamp: Date.now()
                    }));

                    // Refresh button state to "Tiếp tục" for next time
                    isCurrentTaskPending = true;
                    pendingData = JSON.parse(localStorage.getItem('pendingTask'));
                    button.textContent = 'Tiếp tục';
                    button.classList.add('btn-continue');

                    // Hiển thị modal với link và countdown
                    showLinkModal(shortUrl, taskName, Date.now());
                    button.textContent = 'Tiếp tục'; // Keep it as Continue
                    button.disabled = false;
                } else {
                    alert(`Không rút gọn được link cho nhiệm vụ "${taskName}". Vui lòng thử lại sau.`);
                    button.textContent = originalText;
                    button.disabled = false;
                }
            });
        });
    }

    // Function to show link modal with countdown
    function showLinkModal(shortUrl, taskName, startTime = Date.now()) {
        const modal = document.getElementById('linkModal');
        const linkInput = document.getElementById('shortLinkInput');
        const copyBtn = document.getElementById('copyLinkBtn');
        const goBtn = document.getElementById('goToLinkBtn');
        const closeBtn = document.getElementById('closeModal');
        const countdownEl = document.getElementById('countdown');

        if (!modal || !linkInput || !copyBtn || !goBtn || !closeBtn || !countdownEl) {
            // Fallback nếu modal không tồn tại
            window.location.href = shortUrl;
            return;
        }

        // Set link
        linkInput.value = shortUrl;

        // Show modal
        modal.style.display = 'flex';

        // Countdown timer (10 phút = 600 giây)
        const totalDuration = 600; // 10 minutes in seconds
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        let timeLeft = Math.max(0, totalDuration - elapsedTime);
        let countdownInterval;

        function updateCountdown() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                countdownEl.textContent = '00:00';
                alert('Link đã hết hạn! Vui lòng tạo nhiệm vụ mới.');
                closeModal();
            } else {
                timeLeft--;
            }
        }

        // Start countdown
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);

        // Copy button
        copyBtn.onclick = () => {
            linkInput.select();
            document.execCommand('copy');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Đã sao chép!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        };

        // Go to link button
        goBtn.onclick = () => {
            clearInterval(countdownInterval);
            window.location.href = shortUrl;
        };

        // Close button
        function closeModal() {
            clearInterval(countdownInterval);
            modal.style.display = 'none';
        }

        closeBtn.onclick = closeModal;

        // Close when clicking outside modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    function handleTaskCompletion() {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const reward = parseInt(urlParams.get('reward'));
        const taskName = urlParams.get('task');
        const taskId = urlParams.get('taskId');
        const key = urlParams.get('key');

        if (status === 'success' && !isNaN(reward) && key) {
            const pendingTaskStr = localStorage.getItem('pendingTask');
            if (!pendingTaskStr) return;

            const pendingTask = JSON.parse(pendingTaskStr);

            // Verify key and taskId
            if (pendingTask.key === key && pendingTask.taskId === taskId) {
                const user = getCurrentUser();
                if (user) {
                    // Safety check: check limits again
                    if (!user.dailyTasks) user.dailyTasks = {};
                    const turnsDone = user.dailyTasks[taskId] || 0;

                    // Note: In a real app, maxTurns should be verified server-side

                    // Update balance and task count
                    user.balance = (user.balance || 0) + reward;
                    user.tasksCompleted = (user.tasksCompleted || 0) + 1;
                    user.dailyTasks[taskId] = turnsDone + 1;

                    // Add to task history
                    if (!user.taskHistory) user.taskHistory = [];
                    user.taskHistory.push({
                        taskName: taskName,
                        reward: reward,
                        status: 'success', // Hoàn thành
                        timestamp: new Date().toISOString()
                    });

                    updateUserData(user);
                    localStorage.removeItem('pendingTask');

                    // Clear URL params
                    const newUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);

                    alert(`Chúc mừng! Bạn đã hoàn thành nhiệm vụ "${taskName}" và nhận được ${reward.toLocaleString()} VNĐ.`);

                    updateDashboardStats();
                    // If on analytics page, refresh turns
                    if (document.querySelector('.tasks-container')) {
                        initTaskButtons();
                    }
                }
            } else {
                alert('Mã xác thực không hợp lệ hoặc đã hết hạn.');
            }
        }
    }

    // ============================================
    // Task Statistics Rendering
    // ============================================
    function renderTaskStatistics(page = 1) {
        const tbody = document.getElementById('task-stats-body');
        const paginationContainer = document.getElementById('pagination-container');

        if (!tbody) return;

        const user = getCurrentUser();
        const history = (user && user.taskHistory) ? user.taskHistory : [];

        // Sort by timestamp descending (newest first)
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const itemsPerPage = 10;
        const totalItems = history.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Ensure page is valid
        if (page < 1) page = 1;
        if (page > totalPages && totalPages > 0) page = totalPages;

        // Calculate slice range
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = history.slice(startIndex, endIndex);

        // Clear existing rows
        tbody.innerHTML = '';

        if (totalItems === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" style="text-align: center; padding: 20px;">Chưa có dữ liệu nhiệm vụ</td>';
            tbody.appendChild(tr);
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Render rows
        pageItems.forEach(item => {
            const tr = document.createElement('tr');

            // Format timestamp
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            // Status Map
            let statusClass = 'status-pending';
            let statusText = 'Đang xử lý';
            if (item.status === 'success') {
                statusClass = 'status-completed';
                statusText = 'Hoàn thành';
            } else if (item.status === 'failed') {
                statusClass = 'status-failed';
                statusText = 'Thất bại';
            }

            tr.innerHTML = `
                <td>
                    <div class="task-name">
                        <svg class="task-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                        ${item.taskName}
                    </div>
                </td>
                <td><span class="amount">+${item.reward.toLocaleString()} VND</span></td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td><span class="time">${dateStr}</span></td>
            `;
            tbody.appendChild(tr);
        });

        // Render Pagination
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
            if (totalPages > 1) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'pagination';
                paginationDiv.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-top: 20px;';

                // Prev Button
                const prevBtn = document.createElement('button');
                prevBtn.textContent = '«';
                prevBtn.className = 'btn-pagination';
                prevBtn.disabled = page === 1;
                prevBtn.onclick = () => renderTaskStatistics(page - 1);
                stylePaginationButton(prevBtn, page === 1);
                paginationDiv.appendChild(prevBtn);

                // Page Numbers
                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.textContent = i;
                    pageBtn.className = 'btn-pagination';
                    if (i === page) {
                        pageBtn.classList.add('active');
                        pageBtn.style.background = 'rgba(255, 255, 255, 0.2)';
                    }
                    pageBtn.onclick = () => renderTaskStatistics(i);
                    stylePaginationButton(pageBtn, false, i === page);
                    paginationDiv.appendChild(pageBtn);
                }

                // Next Button
                const nextBtn = document.createElement('button');
                nextBtn.textContent = '»';
                nextBtn.className = 'btn-pagination';
                nextBtn.disabled = page === totalPages;
                nextBtn.onclick = () => renderTaskStatistics(page + 1);
                stylePaginationButton(nextBtn, page === totalPages);
                paginationDiv.appendChild(nextBtn);

                paginationContainer.appendChild(paginationDiv);
            }
        }
    }

    function stylePaginationButton(btn, disabled, active = false) {
        btn.style.cssText = `
            background: ${active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 5px 12px;
            border-radius: 5px;
            cursor: cursor;
            transition: all 0.3s ease;
        `;
        if (disabled) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.style.cursor = 'pointer';
            btn.onmouseover = () => btn.style.background = 'rgba(255, 255, 255, 0.4)';
            btn.onmouseout = () => btn.style.background = active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        }
    }

    // ============================================
    // Task Statistics Chart Rendering
    // ============================================
    function initChartToggle() {
        const daysBtn = document.getElementById('chart-days-btn');
        const monthsBtn = document.getElementById('chart-months-btn');

        if (!daysBtn || !monthsBtn) return;

        daysBtn.addEventListener('click', () => {
            daysBtn.classList.add('active');
            monthsBtn.classList.remove('active');
            renderTaskChart('day');
        });

        monthsBtn.addEventListener('click', () => {
            monthsBtn.classList.add('active');
            daysBtn.classList.remove('active');
            renderTaskChart('month');
        });
    }

    function renderTaskChart(viewType = 'day') {
        const container = document.getElementById('chart-container-inner');
        if (!container) return;

        const user = getCurrentUser();
        const history = (user && user.taskHistory) ? user.taskHistory : [];

        container.innerHTML = '';

        let data = [];
        const now = new Date();
        const currentYear = now.getFullYear();

        if (viewType === 'day') {
            // Days of the current month (Max 10 days, Today first)
            // Fetch up to 11 days to have a comparison for the 10th day
            const currentDay = now.getDate();
            for (let i = 0; i < 11; i++) {
                const day = currentDay - i;
                if (day < 1) break;

                const dateStr = day.toString().padStart(2, '0') + '/' + (now.getMonth() + 1).toString().padStart(2, '0');
                const count = history.filter(item => {
                    const itemDate = new Date(item.timestamp);
                    return itemDate.getDate() === day &&
                        itemDate.getMonth() === now.getMonth() &&
                        itemDate.getFullYear() === currentYear &&
                        item.status === 'success';
                }).length;

                data.push({ label: dateStr, value: count });
            }
        } else {
            // Months of the current year (Th1 to Th12)
            for (let i = 0; i <= 11; i++) {
                const monthLabel = 'Th' + (i + 1);

                const count = history.filter(item => {
                    const itemDate = new Date(item.timestamp);
                    return itemDate.getMonth() === i &&
                        itemDate.getFullYear() === currentYear &&
                        item.status === 'success';
                }).length;

                data.push({ label: monthLabel, value: count });
            }
        }
        data.forEach((item, index) => {
            // Only render 10 items for 'day' view
            if (viewType === 'day' && index >= 10) return;

            const barGroup = document.createElement('div');
            barGroup.className = 'chart-bar-group';
            const percentage = Math.min(100, (item.value / 100) * 100);

            let colorClass = 'emerald';
            if (viewType === 'day') {
                if (index < data.length - 1) {
                    const prevChronologicalValue = data[index + 1].value;
                    colorClass = (item.value >= prevChronologicalValue) ? 'emerald' : 'coral';
                }
            } else {
                if (index > 0) {
                    const prevChronologicalValue = data[index - 1].value;
                    colorClass = (item.value >= prevChronologicalValue) ? 'emerald' : 'coral';
                }
            }

            barGroup.innerHTML = `
                <div class="chart-bar bar-${colorClass}" style="height: ${percentage}%; min-height: 2px;" title="${item.value} nhiệm vụ"></div>
                <span class="chart-label">${item.label}</span>
            `;
            container.appendChild(barGroup);
        });
    }

    function showNotification(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `notification-toast ${type}`;

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Load user settings into form fields
     */
    function loadUserSettings() {
        const user = getCurrentUser();
        if (!user) return;

        // Load profile picture
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && user.profilePicture) {
            // Clear text content and add image
            profileAvatar.innerHTML = '';
            const img = document.createElement('img');
            img.src = user.profilePicture;
            img.alt = 'Profile Picture';
            profileAvatar.appendChild(img);

            // Re-add edit button
            const editBtn = document.createElement('div');
            editBtn.className = 'profile-avatar-edit';
            editBtn.id = 'avatarEditBtn';
            editBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            `;
            profileAvatar.appendChild(editBtn);

            // Re-attach click handler
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('profilePictureInput').click();
            });
        }

        // Load personal information
        const firstNameInput = document.getElementById('firstNameInput');
        const lastNameInput = document.getElementById('lastNameInput');
        const emailInput = document.getElementById('emailInput');
        const phoneInput = document.getElementById('phoneInput');

        if (firstNameInput) firstNameInput.value = user.firstName || '';
        if (lastNameInput) lastNameInput.value = user.lastName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';

        // Update display name and email
        const displayName = document.getElementById('profileDisplayName');
        const displayEmail = document.getElementById('profileDisplayEmail');

        if (displayName) {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
            displayName.textContent = fullName;
        }
        if (displayEmail) {
            displayEmail.textContent = user.email || '';
        }

        // Load bank information
        const bankNameInput = document.getElementById('bankNameInput');
        const bankAccountInput = document.getElementById('bankAccountInput');
        const bankAccountNameInput = document.getElementById('bankAccountNameInput');

        if (bankNameInput) bankNameInput.value = user.bankName || '';
        if (bankAccountInput) bankAccountInput.value = user.bankAccount || '';
        if (bankAccountNameInput) bankAccountNameInput.value = user.bankAccountName || '';
    }

    /**
     * Handle profile picture upload
     */
    function handleProfilePictureUpload() {
        const avatarEditBtn = document.getElementById('avatarEditBtn');
        const profilePictureInput = document.getElementById('profilePictureInput');
        const profileAvatar = document.getElementById('profileAvatar');

        if (!avatarEditBtn || !profilePictureInput || !profileAvatar) return;

        // Click on edit button or avatar to upload
        avatarEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profilePictureInput.click();
        });

        profileAvatar.addEventListener('click', () => {
            profilePictureInput.click();
        });

        // Handle file selection
        profilePictureInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Vui lòng chọn file ảnh hợp lệ', 'error');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Kích thước ảnh không được vượt quá 2MB', 'error');
                return;
            }

            // Read and preview image
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;

                // Update avatar preview
                profileAvatar.innerHTML = '';
                const img = document.createElement('img');
                img.src = imageData;
                img.alt = 'Profile Picture';
                profileAvatar.appendChild(img);

                // Re-add edit button
                const editBtn = document.createElement('div');
                editBtn.className = 'profile-avatar-edit';
                editBtn.id = 'avatarEditBtn';
                editBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                `;
                profileAvatar.appendChild(editBtn);

                // Re-attach click handler
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    profilePictureInput.click();
                });

                // Store in temporary variable (will be saved when user clicks save)
                profileAvatar.dataset.newProfilePicture = imageData;

                showNotification('Ảnh đại diện đã được chọn. Nhấn "Lưu Thay Đổi" để lưu.', 'info');
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Validate password change
     */
    function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
        const user = getCurrentUser();
        if (!user) return { valid: false, message: 'Không tìm thấy thông tin người dùng' };

        // Check if any password field is filled
        if (!currentPassword && !newPassword && !confirmPassword) {
            return { valid: true, skip: true }; // No password change requested
        }

        // If any field is filled, all must be filled
        if (!currentPassword || !newPassword || !confirmPassword) {
            return { valid: false, message: 'Vui lòng điền đầy đủ thông tin mật khẩu' };
        }

        // Verify current password
        if (user.password !== currentPassword) {
            return { valid: false, message: 'Mật khẩu hiện tại không đúng' };
        }

        // Check new password length
        if (newPassword.length < 6) {
            return { valid: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
        }

        // Check if new password contains at least one digit
        if (!/\d/.test(newPassword)) {
            return { valid: false, message: 'Mật khẩu mới phải chứa ít nhất một chữ số' };
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return { valid: false, message: 'Mật khẩu xác nhận không khớp' };
        }

        return { valid: true };
    }

    /**
     * Handle settings save
     */
    function handleSettingsSave() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        const cancelBtn = document.getElementById('cancelSettingsBtn');

        if (!saveBtn) return;

        saveBtn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user) {
                showNotification('Vui lòng đăng nhập để lưu thay đổi', 'error');
                return;
            }

            // Show loading state
            saveBtn.classList.add('loading');
            saveBtn.disabled = true;

            // Collect form data
            const updates = {};

            // Personal information
            const firstName = document.getElementById('firstNameInput')?.value.trim();
            const lastName = document.getElementById('lastNameInput')?.value.trim();
            const email = document.getElementById('emailInput')?.value.trim();
            const phone = document.getElementById('phoneInput')?.value.trim();

            if (firstName) updates.firstName = firstName;
            if (lastName) updates.lastName = lastName;
            if (email) {
                // Validate email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    saveBtn.classList.remove('loading');
                    saveBtn.disabled = false;
                    showNotification('Email không hợp lệ', 'error');
                    return;
                }
                updates.email = email;
            }
            if (phone) updates.phone = phone;

            // Bank information
            const bankName = document.getElementById('bankNameInput')?.value;
            const bankAccount = document.getElementById('bankAccountInput')?.value.trim();
            const bankAccountName = document.getElementById('bankAccountNameInput')?.value.trim();

            if (bankName) updates.bankName = bankName;
            if (bankAccount) updates.bankAccount = bankAccount;
            if (bankAccountName) updates.bankAccountName = bankAccountName;

            // Profile picture
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar?.dataset.newProfilePicture) {
                updates.profilePicture = profileAvatar.dataset.newProfilePicture;
                delete profileAvatar.dataset.newProfilePicture;
            }

            // Password change
            const currentPassword = document.getElementById('currentPasswordInput')?.value;
            const newPassword = document.getElementById('newPasswordInput')?.value;
            const confirmPassword = document.getElementById('confirmPasswordInput')?.value;

            const passwordValidation = validatePasswordChange(currentPassword, newPassword, confirmPassword);

            if (!passwordValidation.valid) {
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
                showNotification(passwordValidation.message, 'error');
                return;
            }

            if (!passwordValidation.skip) {
                updates.password = newPassword;
            }

            // Update user data
            const result = updateUserData(updates);

            // Remove loading state
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;

            // Handle result (can be boolean true derived from object or object with success)
            // Original returns boolean true/false, new returns {success: true} or {success: false, message}

            const isSuccess = (result === true) || (result && result.success);

            if (isSuccess) {
                showNotification('Thay đổi đã được lưu thành công!', 'success');

                // Clear password fields
                if (document.getElementById('currentPasswordInput')) {
                    document.getElementById('currentPasswordInput').value = '';
                    document.getElementById('newPasswordInput').value = '';
                    document.getElementById('confirmPasswordInput').value = '';
                }

                // Reload settings to show updated data
                setTimeout(() => {
                    loadUserSettings();
                }, 500);
            } else {
                const msg = result.message || 'Có lỗi xảy ra khi lưu thay đổi';
                showNotification(msg, 'error');
            }
        });

        // Handle cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // Reload original settings
                loadUserSettings();

                // Clear password fields
                if (document.getElementById('currentPasswordInput')) {
                    document.getElementById('currentPasswordInput').value = '';
                    document.getElementById('newPasswordInput').value = '';
                    document.getElementById('confirmPasswordInput').value = '';
                }

                // Clear any pending profile picture
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileAvatar?.dataset.newProfilePicture) {
                    delete profileAvatar.dataset.newProfilePicture;
                }

                showNotification('Đã hủy thay đổi', 'info');
            });
        }
    }

    /**
     * Initialize settings page
     */
    function initSettingsPage() {
        // Check if we're on the settings page
        if (!document.getElementById('profileAvatar')) return;

        loadUserSettings();
        handleProfilePictureUpload();
        handleSettingsSave();
    }


    // ============================================
    // Initialize All Functions
    // ============================================
    function init() {
        initThemeToggle();
        initTiltEffect();
        initMobileMenu();
        initFormValidation();
        initPasswordToggle();
        initPageTransitions();
        initSettingsTabs();
        initSettingsPage(); // Add settings page initialization

        // Load user data first, then initialize counters for animation
        updateDashboardStats();
        initCounters();

        // Task System Initialization
        initTaskButtons();
        handleTaskCompletion();
        renderTaskStatistics();
        initChartToggle();
        renderTaskChart('day');

        // Withdrawal System Initialization
        if (document.getElementById('withdrawal-history-body')) {
            renderWithdrawalHistory();
            initWithdrawalForm();
        }
    }

    // ============================================
    // Withdrawal Management
    // ============================================
    function renderWithdrawalHistory(page = 1) {
        const tbody = document.getElementById('withdrawal-history-body');
        const paginationContainer = document.getElementById('withdrawal-pagination-container');
        if (!tbody) return;

        const user = getCurrentUser();
        const history = (user && user.withdrawalHistory) ? user.withdrawalHistory : [];

        // Sort by timestamp descending
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const itemsPerPage = 5; // Fewer items for withdrawal history as it's a smaller table
        const totalItems = history.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (page < 1) page = 1;
        if (page > totalPages && totalPages > 0) page = totalPages;

        const startIndex = (page - 1) * itemsPerPage;
        const pageItems = history.slice(startIndex, startIndex + itemsPerPage);

        tbody.innerHTML = '';

        if (totalItems === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">Chưa có lịch sử rút tiền</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        pageItems.forEach(item => {
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            let statusClass = 'status-pending';
            let statusText = 'Chờ duyệt';
            if (item.status === 'completed') {
                statusClass = 'status-completed';
                statusText = 'Thành công';
            } else if (item.status === 'failed' || item.status === 'rejected') {
                statusClass = 'status-failed';
                statusText = 'Từ chối';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Thời gian"><span class="time">${dateStr}</span></td>
                <td data-label="Số lượng"><span class="amount">${item.amount.toLocaleString()} Coin</span></td>
                <td data-label="Hình thức"><span class="method">${item.method || 'Ngân hàng'}</span></td>
                <td data-label="Trạng thái"><span class="status ${statusClass}">${statusText}</span></td>
            `;
            tbody.appendChild(tr);
        });

        // Pagination
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
            if (totalPages > 1) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'pagination';
                paginationDiv.style.cssText = 'display: flex; gap: 8px; justify-content: center; margin-top: 20px;';

                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.textContent = i;
                    pageBtn.className = i === page ? 'btn-pagination active' : 'btn-pagination';
                    pageBtn.onclick = () => renderWithdrawalHistory(i);
                    stylePaginationButton(pageBtn, false, i === page);
                    paginationDiv.appendChild(pageBtn);
                }
                paginationContainer.appendChild(paginationDiv);
            }
        }
    }

    function initWithdrawalForm() {
        const input = document.getElementById('withdraw-amount-input');
        const btn = document.getElementById('withdraw-submit-btn');

        if (!input || !btn) return;

        btn.onclick = () => {
            const amount = parseInt(input.value);
            if (isNaN(amount) || amount < 15) {
                alert('Số coin rút tối thiểu là 15 Coin');
                return;
            }

            const user = getCurrentUser();
            if (!user) {
                alert('Vui lòng đăng nhập để thực hiện');
                return;
            }

            if (user.balance < amount) {
                alert('Số dư không đủ để thực hiện rút tiền');
                return;
            }

            if (!user.bankAccount || !user.bankName) {
                if (confirm('Bạn chưa cập nhật thông tin ngân hàng. Cập nhật ngay tại trang Cài đặt?')) {
                    window.location.href = 'settings.html';
                }
                return;
            }

            // Deduct balance and log history
            user.balance -= amount;
            if (!user.withdrawalHistory) user.withdrawalHistory = [];
            user.withdrawalHistory.push({
                amount: amount,
                method: user.bankName,
                status: 'pending',
                timestamp: new Date().toISOString()
            });

            if (updateUserData(user)) {
                input.value = '';
                alert(`Yêu cầu rút ${amount.toLocaleString()} Coin đã được gửi thành công!`);
                updateDashboardStats();
                renderWithdrawalHistory();
            }
        };
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
