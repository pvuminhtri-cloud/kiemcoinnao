document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Determine current page for active class
    const currentPage = window.location.pathname.split('/').pop() || 'tongquat.html';

    const menuHTML = `
        <div class="sidebar-header">
            <div class="logo">K</div>
            <div class="logo-text">KiemCoinNao</div>
        </div>

        <ul class="nav-menu">
            <li class="nav-section">
                <span class="nav-section-title">Admin Menu</span>
                <ul>
                    <li class="nav-item">
                        <a href="tongquat.html" class="nav-link ${currentPage === 'tongquat.html' ? 'active' : ''}">
                            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3h18v18H3zM3 9h18M9 3v18" />
                            </svg>
                            Tổng Quát
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="yeucauruttien.html" class="nav-link ${currentPage === 'yeucauruttien.html' ? 'active' : ''}">
                            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            Duyệt Rút Tiền
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="quanlyuser.html" class="nav-link ${currentPage === 'quanlyuser.html' ? 'active' : ''}">
                            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Quản Lý User
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="../login.html" class="nav-link" id="logout-btn">
                            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                            </svg>
                            Đăng Xuất
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    `;

    sidebar.innerHTML = menuHTML;

    // Mobile menu toggle logic (usually in template script, but adding here as fallback if needed)
    const toggle = document.querySelector('.mobile-menu-toggle');
    if (toggle) {
        toggle.onclick = () => sidebar.classList.toggle('open');
    }
});
