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

// ========== 创建广告轮播区域 ==========
function createAdCarousel() {
    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('ad-carousel-container');
    
    // 左箭头
    const leftArrow = document.createElement('button');
    leftArrow.classList.add('carousel-arrow', 'carousel-arrow-left');
    leftArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
    leftArrow.setAttribute('aria-label', '向左滚动');
    
    // 滚动容器
    const scrollContainer = document.createElement('div');
    scrollContainer.classList.add('ad-carousel-scroll');
    
    // 广告卡片数据（可以根据需要修改）
    const adCards = [
        {
            title: 'Telegram Analytics',
            description: 'Subscribe to stay informed about TGStat news.',
            buttonText: 'Read channel',
            icon: 'fas fa-chart-bar',
            iconBg: '#1e88e5',
            link: '#'
        },
        {
            title: 'TGAlertsBot',
            description: 'Monitoring of keywords in channels and chats',
            buttonText: 'Subscribe',
            icon: 'fas fa-bell',
            iconBg: '#42a5f5',
            link: '#'
        },
        {
            title: 'TGStat Bot',
            description: 'Bot to get channel statistics without leaving Telegram',
            buttonText: 'Start bot',
            icon: 'fas fa-robot',
            iconBg: '#1e88e5',
            link: '#'
        }
    ];
    
    // 创建广告卡片
    adCards.forEach((ad, index) => {
        const card = document.createElement('div');
        card.classList.add('ad-carousel-card');
        
        card.innerHTML = `
            <div class="ad-card-content">
                <div class="ad-card-text">
                    <h3 class="ad-card-title">${ad.title}</h3>
                    <p class="ad-card-description">${ad.description}</p>
                    <button class="ad-card-button" onclick="window.open('${ad.link}', '_blank')">
                        ${ad.buttonText}
                    </button>
                </div>
                <div class="ad-card-icon" style="background-color: ${ad.iconBg};">
                    <i class="${ad.icon}"></i>
                </div>
            </div>
            <div class="ad-card-label">
                <i class="fas fa-info-circle"></i>
                <span>ad</span>
            </div>
        `;
        
        scrollContainer.appendChild(card);
    });
    
    // 右箭头
    const rightArrow = document.createElement('button');
    rightArrow.classList.add('carousel-arrow', 'carousel-arrow-right');
    rightArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
    rightArrow.setAttribute('aria-label', '向右滚动');
    
    // 滚动功能
    const scrollAmount = 400; // 每次滚动的距离
    
    leftArrow.addEventListener('click', () => {
        scrollContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });
    
    rightArrow.addEventListener('click', () => {
        scrollContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });
    
    // 更新箭头显示状态和居中逻辑
    const updateArrows = () => {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
        leftArrow.style.opacity = scrollLeft > 0 ? '1' : '0.3';
        rightArrow.style.opacity = scrollLeft < scrollWidth - clientWidth - 10 ? '1' : '0.3';
        
        // 如果内容宽度小于等于容器宽度，居中显示；否则允许滚动
        if (scrollWidth <= clientWidth) {
            scrollContainer.classList.remove('scrollable');
        } else {
            scrollContainer.classList.add('scrollable');
        }
    };
    
    // 监听滚动和窗口大小变化
    scrollContainer.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    
    // 初始检查（延迟一下确保DOM已渲染）
    setTimeout(updateArrows, 100);
    updateArrows();
    
    carouselContainer.appendChild(leftArrow);
    carouselContainer.appendChild(scrollContainer);
    carouselContainer.appendChild(rightArrow);
    
    return carouselContainer;
}

// ========== 渲染内容 ==========
function renderContent() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    // 在内容最前面添加广告轮播
    const adCarousel = createAdCarousel();
    contentDiv.appendChild(adCarousel);
    
    // 检查是否已通过成人认证
    const isAdultVerified = localStorage.getItem('adultVerified') === 'true';
    
    jsonData.categories.forEach((category, catIndex) => {
        // 跳过隐藏的分类
        if (category.hidden === true) {
            return;
        }
        
        category.children.forEach((child, childIndex) => {
            if (!child.items || child.items.length === 0) return;
            
            // 检查是否是成人内容分类（成人乐园）
            const isPendingCategory = category.parentName === '成人乐园';
            
            const sectionId = `section-${catIndex}-${childIndex}`;
            
            // 创建section容器
            const sectionContainer = document.createElement('div');
            sectionContainer.classList.add('section-container');
            sectionContainer.id = sectionId;
            
            // 创建标题行容器
            const titleRow = document.createElement('div');
            titleRow.classList.add('section-title-row');
            
            // 创建标题
            const title = document.createElement('h2');
            title.textContent = child.name;
            titleRow.appendChild(title);
            
            // 如果是暂定分类且未通过认证，显示认证提示和按钮
            if (isPendingCategory && !isAdultVerified) {
                const ageWarning = document.createElement('div');
                ageWarning.classList.add('age-warning-badge');
                ageWarning.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>需要成人认证</span>
                `;
                
                const verifyBtn = document.createElement('button');
                verifyBtn.classList.add('age-verify-btn');
                verifyBtn.innerHTML = `
                    <i class="fas fa-shield-alt"></i>
                    <span>点击认证</span>
                `;
                verifyBtn.addEventListener('click', function() {
                    showAgeVerificationModal();
                });
                
                titleRow.appendChild(ageWarning);
                titleRow.appendChild(verifyBtn);
            } else {
                // 已认证或非成人内容分类：显示免责声明
                const disclaimer = document.createElement('div');
                disclaimer.classList.add('section-disclaimer');
                disclaimer.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>本网站仅提供导航，不对链接内容负责</span>
                `;
                titleRow.appendChild(disclaimer);
            }
            
            sectionContainer.appendChild(titleRow);
            
            // 如果是成人内容分类且未通过认证，不显示内容，只显示标题
            if (isPendingCategory && !isAdultVerified) {
                contentDiv.appendChild(sectionContainer);
                return;
            }
            
            // 在"常用机器人"分类前插入广告位A
            if (child.name === '常用机器人') {
                const adSpaceA = createAdSpaceA();
                contentDiv.appendChild(adSpaceA);
            }
            
            // 创建网格容器
            const gridContainer = document.createElement('div');
            gridContainer.classList.add('grid-container');
            
            // 默认只显示15个标签（3排，每排5个）
            const INITIAL_DISPLAY_COUNT = 15;
            const totalItems = child.items.length;
            const itemsToShow = totalItems > INITIAL_DISPLAY_COUNT ? INITIAL_DISPLAY_COUNT : totalItems;
            
            // 创建卡片（默认只显示前15个）
            for (let i = 0; i < itemsToShow; i++) {
                const card = createCard(child.items[i]);
                gridContainer.appendChild(card);
            }
            
            sectionContainer.appendChild(gridContainer);
            
            // 如果标签数量超过15个，添加"展开更多"按钮
            if (totalItems > INITIAL_DISPLAY_COUNT) {
                const expandButton = document.createElement('button');
                expandButton.classList.add('expand-more-btn');
                expandButton.innerHTML = `
                    <i class="fas fa-chevron-down"></i>
                    <span>展开更多 (${totalItems - INITIAL_DISPLAY_COUNT} 个)</span>
                `;
                
                expandButton.addEventListener('click', function() {
                    // 隐藏按钮
                    expandButton.style.display = 'none';
                    
                    // 显示剩余的标签
                    for (let i = INITIAL_DISPLAY_COUNT; i < totalItems; i++) {
                        const card = createCard(child.items[i]);
                        gridContainer.appendChild(card);
                    }
                });
                
                sectionContainer.appendChild(expandButton);
            }
            
            contentDiv.appendChild(sectionContainer);
        });
    });
}

// ========== 创建广告位A ==========
function createAdSpaceA() {
    const adContainer = document.createElement('div');
    adContainer.classList.add('ad-space-a-container');
    
    const adBox = document.createElement('div');
    adBox.classList.add('ad-space-a');
    
    adBox.innerHTML = `
        <div class="ad-space-a-content">
            <div class="ad-space-a-icon">
                <i class="fas fa-bullhorn"></i>
            </div>
            <div class="ad-space-a-text">
                <h3>诚招广告合作！</h3>
                <p>优质广告位火热招募中，欢迎联系洽谈</p>
            </div>
            <div class="ad-space-a-contact">
                <a href="mailto:dlxmyhc@gmail.com" class="ad-space-a-link">
                    <i class="fas fa-envelope"></i>
                    联系合作：dlxmyhc@gmail.com
                </a>
            </div>
        </div>
    `;
    
    adContainer.appendChild(adBox);
    return adContainer;
}

// ========== 生成导航菜单 ==========
function generateNavigationMenu() {
    const menu = document.getElementById('menu');
    menu.innerHTML = '';
    
    // 检查是否已通过成人认证
    const isAdultVerified = localStorage.getItem('adultVerified') === 'true';
    
    let sectionIndex = 0;
    
    jsonData.categories.forEach((category, catIndex) => {
        // 跳过隐藏的分类
        if (category.hidden === true) {
            return;
        }
        
        const isPendingCategory = category.parentName === '成人乐园';
        
        const parentLi = document.createElement('li');
        parentLi.classList.add('menu-item', 'menu-item-parent');
        
        if (isPendingCategory) {
            parentLi.classList.add('pending-category');
        }
        
        const parentLink = document.createElement('a');
        parentLink.href = '#';
        
        if (isPendingCategory && !isAdultVerified) {
            // 成人内容分类未认证：显示锁定图标，点击弹出认证
            parentLink.innerHTML = `
                <i class="${category.parentIcon || 'fas fa-lock'}"></i>
                <span class="menu-item-text">${category.parentName}</span>
                <i class="fas fa-lock menu-item-lock"></i>
            `;
            
            parentLi.appendChild(parentLink);
            
            // 点击显示成人认证弹窗
            parentLink.addEventListener('click', function(e) {
                e.preventDefault();
                showAgeVerificationModal();
            });
            
            // 将父li添加到菜单
            menu.appendChild(parentLi);
            return; // 未认证时不继续处理子菜单
        } else {
            // 正常分类或已认证的成人内容分类：正常显示
            parentLink.innerHTML = `
                <i class="${category.parentIcon}"></i>
                <span class="menu-item-text">${category.parentName}</span>
                <i class="fas fa-chevron-down menu-item-arrow"></i>
            `;
            
            // 先添加父链接到父li
            parentLi.appendChild(parentLink);
            
            // 创建子菜单（只有认证后才显示）
            if (isPendingCategory && isAdultVerified || !isPendingCategory) {
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
                
                // 将子菜单添加到父li（在父链接之后）
                if (subMenu.children.length > 0) {
                    parentLi.appendChild(subMenu);
                }
            }
            
            // 父级点击展开/收起（只有有子菜单时才展开）
            parentLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (parentLi.querySelector('.sub-menu')) {
                    parentLi.classList.toggle('expanded');
                }
            });
        }
        
        // 将父li添加到菜单
        menu.appendChild(parentLi);
    });
}

// ========== 成人认证功能 ==========
function showAgeVerificationModal() {
    const modal = document.getElementById('ageVerificationModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideAgeVerificationModal() {
    const modal = document.getElementById('ageVerificationModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function setupAgeVerification() {
    const confirmBtn = document.getElementById('ageConfirmBtn');
    const cancelBtn = document.getElementById('ageCancelBtn');
    const modal = document.getElementById('ageVerificationModal');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            // 保存认证状态
            localStorage.setItem('adultVerified', 'true');
            // 隐藏弹窗
            hideAgeVerificationModal();
            // 重新渲染内容和菜单（会显示成人内容分类的子菜单和内容）
            renderContent();
            generateNavigationMenu();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideAgeVerificationModal();
        });
    }
    
    // 点击弹窗外部关闭
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideAgeVerificationModal();
            }
        });
    }
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            hideAgeVerificationModal();
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
    // 优先尝试加载拆分后的数据（data/index.json）
    fetch('data/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载索引文件');
            }
            return response.json();
        })
        .then(indexData => {
            console.log('索引数据加载成功:', indexData);
            
            // 加载所有分类文件并合并
            const categoryPromises = indexData.categories.map(category => {
                return fetch(`data/${category.file}`)
                    .then(response => {
                        if (!response.ok) {
                            console.warn(`无法加载分类文件: ${category.file}`);
                            return null;
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.warn(`加载分类文件失败: ${category.file}`, error);
                        return null;
                    });
            });
            
            return Promise.all(categoryPromises).then(categoryDataList => {
                // 合并数据，保留 hidden 字段
                const mergedData = {
                    meta: indexData.meta,
                    categories: categoryDataList
                        .map((data, index) => {
                            if (data === null) return null;
                            const indexCategory = indexData.categories[index];
                            return {
                                id: data.id,
                                parentName: data.parentName,
                                parentIcon: data.parentIcon,
                                hidden: indexCategory.hidden || false,  // 保留 hidden 字段
                                children: data.children
                            };
                        })
                        .filter(data => data !== null)
                };
                
                jsonData = mergedData;
                console.log('数据合并成功:', mergedData);
                
                // 渲染内容
                renderContent();
                
                // 生成导航菜单
                generateNavigationMenu();
            });
        })
        .catch(error => {
            console.warn('加载拆分数据失败，尝试加载单文件 data.json:', error);
            
            // 如果拆分数据加载失败，回退到单文件模式
            return fetch('data.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('无法加载数据文件');
                    }
                    return response.json();
                })
                .then(data => {
                    jsonData = data;
                    console.log('JSON数据加载成功（单文件模式）:', data);
                    
                    // 渲染内容
                    renderContent();
                    
                    // 生成导航菜单
                    generateNavigationMenu();
                });
        })
        .catch(error => {
            console.error('加载数据时出错:', error);
            const contentDiv = document.getElementById('content');
            if (!contentDiv) return;
            
            contentDiv.innerHTML = '';
            
            const errorContainer = document.createElement('div');
            errorContainer.style.cssText = 'padding: 40px; text-align: center; color: #999;';
            
            const errorIcon = document.createElement('i');
            errorIcon.className = 'fas fa-exclamation-triangle';
            errorIcon.style.cssText = 'font-size: 3rem; margin-bottom: 20px; color: #ff6b6b;';
            
            const errorTitle = document.createElement('h2');
            errorTitle.textContent = '数据加载失败';
            
            const errorMsg = document.createElement('p');
            errorMsg.textContent = '请确保 data/index.json 或 data.json 文件存在且格式正确';
            
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

// ========== 访问计数器 ==========
function initVisitorCounter() {
    const counterElement = document.getElementById('visitorCount');
    if (!counterElement) return;
    
    // 基准日期（网站上线日期）
    const baseDate = new Date('2023-01-01');
    const baseCount = 12345; // 初始访问数
    
    // 获取今天的日期（只考虑年月日，忽略时分秒）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 计算从基准日期到今天的天数
    const daysDiff = Math.floor((today - baseDate) / (1000 * 60 * 60 * 24));
    
    // 使用日期作为随机种子，确保同一天显示相同数字
    const dateString = today.toISOString().split('T')[0].replace(/-/g, '');
    const seed = parseInt(dateString);
    
    // 基于种子生成随机数（每天固定）
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // 每天随机增加 80-200 的访问量
    const dailyIncrease = Math.floor(80 + seededRandom(seed) * 120);
    
    // 计算总访问数
    const totalCount = baseCount + (daysDiff * 150) + (dailyIncrease * daysDiff);
    
    // 格式化数字（添加千位分隔符）
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // 动画显示数字
    const targetCount = totalCount;
    let currentCount = Math.floor(targetCount * 0.9); // 从90%开始动画
    const increment = Math.max(1, Math.floor((targetCount - currentCount) / 50));
    
    const updateCounter = () => {
        if (currentCount < targetCount) {
            currentCount += increment;
            if (currentCount > targetCount) {
                currentCount = targetCount;
            }
            counterElement.textContent = formatNumber(currentCount);
            requestAnimationFrame(updateCounter);
        } else {
            counterElement.textContent = formatNumber(targetCount);
        }
    };
    
    // 延迟一下再开始动画，让页面先加载
    setTimeout(() => {
        updateCounter();
    }, 500);
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
    
    // 设置成人认证
    setupAgeVerification();
    
    // 初始化访问计数器
    initVisitorCounter();
    
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

