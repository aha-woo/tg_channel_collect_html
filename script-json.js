// ========== JSON数据加载脚本 ==========
// 这是专门用于加载 data.json 的脚本
// 如果要使用JSON格式，请在 index.html 中将 script.js 替换为 script-json.js

// ========== 全局变量 ==========
let sectionsData = [];
let currentActiveSection = null;
let jsonData = null;

// ========== 工具函数：获取Favicon ==========
function getFaviconUrl(url, customLogo) {
    // 如果提供了自定义Logo，直接使用
    if (customLogo && customLogo.trim() !== '') {
        return customLogo;
    }
    
    if (!url || url === '#') {
        return null;
    }

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // 对于Telegram链接，使用Telegram的favicon
        if (domain.includes('t.me') || domain.includes('telegram.org')) {
            return `https://telegram.org/img/t_logo.png`;
        }
        
        // 对于GitHub链接
        if (domain.includes('github.com')) {
            return `https://github.com/favicon.ico`;
        }
        
        // 使用多个favicon服务（按优先级）
        // 优先使用Google，失败时img的onerror会处理
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
        console.error('Error parsing URL:', url, e);
        return null;
    }
}

// ========== 创建卡片 ==========
function createCard(item) {
    const card = document.createElement('div');
    card.classList.add('card');
    
    // 卡片点击动画
    card.addEventListener('click', function(e) {
        if (e.target.tagName !== 'A') {
            this.classList.add('clicked');
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 600);
        }
    });
    
    const link = document.createElement('a');
    link.href = item.url || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Logo
    const logo = document.createElement('div');
    logo.classList.add('card-logo');
    
    const faviconUrl = getFaviconUrl(item.url, item.logo);
    if (faviconUrl) {
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.alt = item.title;
        
        // 多重备选方案（6层备选）
        let fallbackIndex = 0;
        const fallbackSources = [
            () => `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=128`,
            () => `https://${new URL(item.url).hostname}/favicon.ico`,
            () => `https://icon.horse/icon/${new URL(item.url).hostname}`,
            () => `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=64`,
            () => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(item.url)}&size=128`,
            () => `https://favicons.githubusercontent.com/${new URL(item.url).hostname}`
        ];
        
        img.onerror = function() {
            fallbackIndex++;
            if (fallbackIndex < fallbackSources.length) {
                try {
                    this.src = fallbackSources[fallbackIndex]();
                } catch (e) {
                    fallbackIndex = fallbackSources.length; // 跳到最后
                }
            }
            
            // 所有方案都失败，显示默认图标
            if (fallbackIndex >= fallbackSources.length) {
                this.style.display = 'none';
                const icon = document.createElement('i');
                // 根据链接类型显示不同图标（安全：不使用innerHTML）
                if (item.url && item.url.includes('t.me')) {
                    icon.className = 'fab fa-telegram';
                } else {
                    icon.className = 'fas fa-link';
                }
                logo.appendChild(icon);
            }
        };
        logo.appendChild(img);
    } else {
        const icon = document.createElement('i');
        icon.className = 'fas fa-link';
        logo.appendChild(icon);
    }
    
    // 信息区域
    const info = document.createElement('div');
    info.classList.add('card-info');
    
    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = item.url || '#';
    titleLink.target = '_blank';
    titleLink.textContent = item.title || '未命名';
    title.appendChild(titleLink);
    
    const description = document.createElement('p');
    // 安全清理：移除所有HTML标签和脚本，防止XSS攻击
    const descriptionText = item.description || '暂无描述';
    
    // 第一步：移除HTML标签和脚本
    let plainText = descriptionText
        .replace(/<script[^>]*>.*?<\/script>/gi, '')  // 移除script标签
        .replace(/<style[^>]*>.*?<\/style>/gi, '')    // 移除style标签
        .replace(/<[^>]+>/g, '')                       // 移除所有HTML标签
        .replace(/javascript:/gi, '')                  // 移除javascript:协议
        .trim();
    
    // 第二步：移除URL（http/https链接、t.me链接等）
    // 匹配各种URL格式：http://, https://, www., t.me, 等等
    plainText = plainText
        .replace(/https?:\/\/[^\s]+/gi, '')           // 移除 http:// 或 https:// 开头的URL
        .replace(/www\.[^\s]+/gi, '')                  // 移除 www. 开头的URL
        .replace(/t\.me\/[^\s]+/gi, '')               // 移除 t.me/ 开头的链接
        .replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/gi, '')  // 移除域名/路径格式的URL
        .replace(/[a-zA-Z0-9-]+\.(com|org|net|io|co|cn|me|xyz|top|site|online)\/[^\s]*/gi, '')  // 移除常见域名后缀的URL
        .replace(/\s+/g, ' ')                          // 合并多个空格为一个
        .trim();
    
    // 显示清理后的文本（不包含URL）
    description.textContent = plainText || '暂无描述';
    
    info.appendChild(title);
    info.appendChild(description);
    
    link.appendChild(logo);
    card.appendChild(link);
    card.appendChild(info);
    
    // 添加tooltip（显示完整描述，但也要清理URL）
    // tooltip显示原始描述（清理HTML和脚本后），但移除URL
    const tooltipText = descriptionText
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/https?:\/\/[^\s]+/gi, '')
        .replace(/www\.[^\s]+/gi, '')
        .replace(/t\.me\/[^\s]+/gi, '')
        .replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/gi, '')
        .replace(/[a-zA-Z0-9-]+\.(com|org|net|io|co|cn|me|xyz|top|site|online)\/[^\s]*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    // 如果描述文本较长（超过显示长度），添加tooltip
    if (tooltipText && tooltipText.length > 0) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('card-tooltip');
        tooltip.textContent = tooltipText;
        card.appendChild(tooltip);
    }
    
    return card;
}

// ========== 渲染内容 ==========
function renderContent() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    jsonData.categories.forEach((category, catIndex) => {
        category.children.forEach((child, childIndex) => {
            if (!child.items || child.items.length === 0) return;
            
            const sectionId = `section-${catIndex}-${childIndex}`;
            
            // 创建section容器
            const sectionContainer = document.createElement('div');
            sectionContainer.classList.add('section-container');
            sectionContainer.id = sectionId;
            
            // 创建标题
            const title = document.createElement('h2');
            title.textContent = child.name;
            sectionContainer.appendChild(title);
            
            // 创建网格容器
            const gridContainer = document.createElement('div');
            gridContainer.classList.add('grid-container');
            
            // 创建卡片
            child.items.forEach(item => {
                const card = createCard(item);
                gridContainer.appendChild(card);
            });
            
            sectionContainer.appendChild(gridContainer);
            contentDiv.appendChild(sectionContainer);
        });
    });
}

// ========== 生成导航菜单 ==========
function generateNavigationMenu() {
    const menu = document.getElementById('menu');
    menu.innerHTML = '';
    
    let sectionIndex = 0;
    
    jsonData.categories.forEach((category, catIndex) => {
        const parentLi = document.createElement('li');
        parentLi.classList.add('menu-item', 'menu-item-parent');
        
        const parentLink = document.createElement('a');
        parentLink.href = '#';
        parentLink.innerHTML = `
            <i class="${category.parentIcon}"></i>
            <span class="menu-item-text">${category.parentName}</span>
            <i class="fas fa-chevron-down menu-item-arrow"></i>
        `;
        
        parentLi.appendChild(parentLink);
        
        // 创建子菜单
        const subMenu = document.createElement('ul');
        subMenu.classList.add('sub-menu');
        
        category.children.forEach((child, childIndex) => {
            if (!child.items || child.items.length === 0) return;
            
            const childLi = document.createElement('li');
            childLi.classList.add('menu-item');
            
            const childLink = document.createElement('a');
            childLink.href = `#section-${catIndex}-${childIndex}`;
            childLink.innerHTML = `
                <i class="${child.icon}"></i>
                <span class="menu-item-text">${child.name}</span>
            `;
            
            childLink.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // 移动端关闭侧边栏
                    if (window.innerWidth <= 768) {
                        document.getElementById('sidebar').classList.remove('expanded');
                    }
                }
            });
            
            childLi.appendChild(childLink);
            subMenu.appendChild(childLi);
            sectionIndex++;
        });
        
        if (subMenu.children.length > 0) {
            parentLi.appendChild(subMenu);
            
            // 父级点击展开/收起
            parentLink.addEventListener('click', function(e) {
                e.preventDefault();
                parentLi.classList.toggle('expanded');
            });
            
            menu.appendChild(parentLi);
        }
    });
}

// ========== 搜索功能 ==========
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.card');
        const sections = document.querySelectorAll('.section-container');
        
        cards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent.toLowerCase() || '';
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
        
        sections.forEach(section => {
            const visibleCards = section.querySelectorAll('.card[style*="display: flex"]');
            if (visibleCards.length > 0) {
                section.style.display = 'block';
            } else {
                section.style.display = searchTerm === '' ? 'block' : 'none';
            }
        });
    });
}

// ========== 侧边栏展开/收起功能 ==========
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);
    
    // 检查本地存储的侧边栏状态（仅桌面端）
    if (window.innerWidth > 768) {
        const savedState = localStorage.getItem('sidebarExpanded');
        // 默认展开，除非用户手动设置为收起
        if (savedState === null || savedState === 'true') {
            sidebar.classList.add('expanded');
        }
    }
    
    // 切换侧边栏
    toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('expanded');
        
        // 保存状态（仅桌面端）
        if (window.innerWidth > 768) {
            localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
        }
        
        // 移动端显示遮罩
        if (window.innerWidth <= 768 && sidebar.classList.contains('expanded')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    });
    
    // 点击遮罩关闭侧边栏
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('expanded');
        overlay.classList.remove('active');
    });
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            overlay.classList.remove('active');
        } else {
            sidebar.classList.remove('expanded');
            overlay.classList.remove('active');
        }
    });
}

// ========== 弹窗功能 ==========
function setupModals() {
    // 推广合作按钮
    const cooperateBtn = document.getElementById('cooperateBtn');
    const cooperateModal = document.getElementById('cooperateModal');
    
    // 机器人定制按钮
    const customBotBtn = document.getElementById('customBotBtn');
    const customBotModal = document.getElementById('customBotModal');
    
    // 所有关闭按钮
    const closeBtns = document.querySelectorAll('.close-btn');
    
    // 打开推广合作弹窗
    if (cooperateBtn) {
        cooperateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cooperateModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // 打开机器人定制弹窗
    if (customBotBtn) {
        customBotBtn.addEventListener('click', function(e) {
            e.preventDefault();
            customBotModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // 关闭弹窗
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
                document.body.style.overflow = 'auto';
            });
        }
    });
}

// ========== 加载JSON数据并渲染 ==========
function loadAndRenderData() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载数据文件');
            }
            return response.json();
        })
        .then(data => {
            jsonData = data;
            console.log('JSON数据加载成功:', data);
            
            // 渲染内容
            renderContent();
            
            // 生成导航菜单
            generateNavigationMenu();
        })
        .catch(error => {
            console.error('加载数据时出错:', error);
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = '';
            
            const errorContainer = document.createElement('div');
            errorContainer.style.cssText = 'padding: 40px; text-align: center; color: #999;';
            
            const errorIcon = document.createElement('i');
            errorIcon.className = 'fas fa-exclamation-triangle';
            errorIcon.style.cssText = 'font-size: 3rem; margin-bottom: 20px; color: #ff6b6b;';
            
            const errorTitle = document.createElement('h2');
            errorTitle.textContent = '数据加载失败';
            
            const errorMsg = document.createElement('p');
            errorMsg.textContent = '请确保 data.json 文件存在且格式正确';
            
            const errorDetail = document.createElement('p');
            errorDetail.style.cssText = 'font-size: 0.9em; color: #999;';
            errorDetail.textContent = `错误信息: ${error.message}`;
            
            errorContainer.appendChild(errorIcon);
            errorContainer.appendChild(errorTitle);
            errorContainer.appendChild(errorMsg);
            errorContainer.appendChild(errorDetail);
            contentDiv.appendChild(errorContainer);
        });
}

// ========== 设置广告招募横幅 ==========
function setupAdBanner() {
    const banner = document.getElementById('adRecruitmentBanner');
    const closeBtn = document.getElementById('closeBanner');
    
    if (closeBtn && banner) {
        closeBtn.addEventListener('click', function() {
            banner.style.display = 'none';
            // 保存到localStorage，这样用户关闭后不会再次显示
            localStorage.setItem('adBannerClosed', 'true');
        });
    }
    
    // 检查是否已经关闭过
    if (banner && localStorage.getItem('adBannerClosed') === 'true') {
        banner.style.display = 'none';
    }
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 加载数据
    loadAndRenderData();
    
    // 设置搜索功能
    setupSearch();
    
    // 设置侧边栏
    setupSidebar();
    
    // 设置弹窗
    setupModals();
    
    // 设置广告招募横幅
    setupAdBanner();
    
    // 平滑滚动到锚点
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetElement = document.getElementById(hash);
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    });
    
    // 处理初始hash
    if (window.location.hash) {
        setTimeout(() => {
            const hash = window.location.hash.substring(1);
            const targetElement = document.getElementById(hash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    }
});

