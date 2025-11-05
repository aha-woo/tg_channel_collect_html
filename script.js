// ========== 全局变量 ==========
let sectionsData = [];
let currentActiveSection = null;

// ========== 工具函数：获取Favicon ==========
function getFaviconUrl(url) {
    if (!url || url === '#') {
        return null;
    }

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // 对于Telegram链接，使用Telegram的logo
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

// ========== 工具函数：解析Markdown表格 ==========
function parseMarkdownTable(markdownText) {
    const lines = markdownText.trim().split('\n');
    const rows = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || !line.startsWith('|')) continue;
        
        // 跳过表头分隔行（如 | :--- | :---: | :--- |）
        if (line.match(/^\|[\s:\-]+[\|:]/)) continue;
        
        // 移除首尾的 |
        line = line.replace(/^\|/, '').replace(/\|$/, '');
        
        // 分割单元格，但要注意不能分割被引号或括号包围的内容
        const cells = [];
        let currentCell = '';
        let inBrackets = 0;
        let inParentheses = 0;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '[') inBrackets++;
            else if (char === ']') inBrackets--;
            else if (char === '(') inParentheses++;
            else if (char === ')') inParentheses--;
            
            if (char === '|' && inBrackets === 0 && inParentheses === 0) {
                cells.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        
        if (currentCell.trim()) {
            cells.push(currentCell.trim());
        }
        
        if (cells.length >= 3) {
            rows.push({
                name: cells[0].replace(/\*\*/g, '').replace(/\*/g, '').trim(),
                link: cells[1],
                description: cells[2]
            });
        }
    }
    
    return rows;
}

// ========== 工具函数：提取链接 ==========
function extractLink(cellText) {
    if (!cellText || cellText.trim() === '') {
        return { text: '', url: '#' };
    }
    
    // 尝试匹配markdown链接格式 [text](url)
    const markdownLinkMatch = cellText.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (markdownLinkMatch) {
        return {
            text: markdownLinkMatch[1].trim(),
            url: markdownLinkMatch[2].trim()
        };
    }
    
    // 尝试匹配纯URL（http://或https://开头）
    const urlMatch = cellText.match(/(https?:\/\/[^\s\)]+)/);
    if (urlMatch) {
        return {
            text: urlMatch[1],
            url: urlMatch[1]
        };
    }
    
    // 尝试匹配Telegram用户名格式 @username 或 @username?start=xxx
    const telegramMatch = cellText.match(/@([a-zA-Z0-9_]+)(?:\?[^\s\)]+)?/);
    if (telegramMatch) {
        const username = telegramMatch[1];
        const params = telegramMatch[2] || '';
        return {
            text: `@${username}`,
            url: `https://t.me/${username}${params}`
        };
    }
    
    // 尝试匹配域名（如 shop.tg10000.com）
    const domainMatch = cellText.match(/([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,})/);
    if (domainMatch) {
        const domain = domainMatch[1];
        return {
            text: domain,
            url: `http://${domain}`
        };
    }
    
    return {
        text: cellText.trim(),
        url: '#'
    };
}

// ========== 创建卡片元素 ==========
function createCard(item) {
    const card = document.createElement('div');
    card.classList.add('card');
    
    const linkInfo = extractLink(item.link);
    const faviconUrl = getFaviconUrl(linkInfo.url);
    
    // 创建logo容器
    const logoDiv = document.createElement('div');
    logoDiv.classList.add('card-logo');
    
    if (faviconUrl) {
        const img = document.createElement('img');
        img.src = faviconUrl;
        img.alt = item.name;
        
        // 多重备选方案（6层备选）
        let fallbackIndex = 0;
        const url = linkInfo.url;
        const fallbackSources = [
            () => `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`,
            () => `https://${new URL(url).hostname}/favicon.ico`,
            () => `https://icon.horse/icon/${new URL(url).hostname}`,
            () => `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
            () => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(url)}&size=128`,
            () => `https://favicons.githubusercontent.com/${new URL(url).hostname}`
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
                const placeholder = document.createElement('div');
                placeholder.classList.add('placeholder-icon');
                // 根据链接类型显示不同图标
                if (url.includes('t.me')) {
                    const telegramIcon = document.createElement('i');
                    telegramIcon.className = 'fab fa-telegram';
                    placeholder.appendChild(telegramIcon);
                } else {
                    const linkIcon = document.createElement('i');
                    linkIcon.className = 'fas fa-link';
                    placeholder.appendChild(linkIcon);
                }
                logoDiv.appendChild(placeholder);
            }
        };
        logoDiv.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.classList.add('placeholder-icon');
        const linkIcon = document.createElement('i');
        linkIcon.className = 'fas fa-link';
        placeholder.appendChild(linkIcon);
        logoDiv.appendChild(placeholder);
    }
    
    // 创建信息容器
    const infoDiv = document.createElement('div');
    infoDiv.classList.add('card-info');
    
    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = linkInfo.url;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.textContent = item.name;
    title.appendChild(titleLink);
    
    const description = document.createElement('p');
    const descriptionText = item.description || '';
    // 安全清理：移除所有HTML标签和脚本，防止XSS攻击
    let plainText = descriptionText
        .replace(/<script[^>]*>.*?<\/script>/gi, '')  // 移除script标签
        .replace(/<style[^>]*>.*?<\/style>/gi, '')    // 移除style标签
        .replace(/<[^>]+>/g, '')                       // 移除所有HTML标签
        .replace(/javascript:/gi, '')                  // 移除javascript:协议
        .trim();
    
    // 移除URL（http/https链接、t.me链接等）
    plainText = plainText
        .replace(/https?:\/\/[^\s]+/gi, '')           // 移除 http:// 或 https:// 开头的URL
        .replace(/www\.[^\s]+/gi, '')                  // 移除 www. 开头的URL
        .replace(/t\.me\/[^\s]+/gi, '')               // 移除 t.me/ 开头的链接
        .replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/gi, '')  // 移除域名/路径格式的URL
        .replace(/[a-zA-Z0-9-]+\.(com|org|net|io|co|cn|me|xyz|top|site|online)\/[^\s]*/gi, '')  // 移除常见域名后缀的URL
        .replace(/\s+/g, ' ')                          // 合并多个空格为一个
        .trim();
    
    description.textContent = plainText;
    infoDiv.appendChild(title);
    infoDiv.appendChild(description);
    
    // 创建tooltip（显示完整描述，但也要清理URL）
    // tooltip使用清理URL后的文本
    if (plainText.length > 0) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('card-tooltip');
        tooltip.textContent = plainText;
        card.appendChild(tooltip);
    }
    
    // 创建链接图标
    const linkIcon = document.createElement('div');
    linkIcon.classList.add('card-link-icon');
    const linkIconAnchor = document.createElement('a');
    linkIconAnchor.href = linkInfo.url;
    linkIconAnchor.target = '_blank';
    linkIconAnchor.rel = 'noopener noreferrer';
    const externalIcon = document.createElement('i');
    externalIcon.className = 'fas fa-external-link-alt';
    linkIconAnchor.appendChild(externalIcon);
    linkIcon.appendChild(linkIconAnchor);
    
    // 组装卡片
    card.appendChild(logoDiv);
    card.appendChild(infoDiv);
    card.appendChild(linkIcon);
    
    // 添加点击动画
    card.addEventListener('click', function(e) {
        // 如果点击的是链接，不阻止默认行为
        if (e.target.closest('a')) {
            return;
        }
        
        // 添加点击动画类
        card.classList.add('clicked');
        
        // 动画结束后移除类
        setTimeout(() => {
            card.classList.remove('clicked');
        }, 600);
        
        // 打开链接
        if (linkInfo.url !== '#') {
            window.open(linkInfo.url, '_blank', 'noopener,noreferrer');
        }
    });
    
    return card;
}

// ========== 创建导航菜单项 ==========
function createMenuItem(section, icon, isParent = false, children = []) {
    const li = document.createElement('li');
    li.classList.add('menu-item');
    if (isParent) {
        li.classList.add('menu-item-parent');
    }
    
    const a = document.createElement('a');
    a.href = `#${section.id}`;
    
    // 如果是父级菜单，添加展开/收起图标
    const expandIcon = isParent ? '<i class="fas fa-chevron-down menu-item-expand"></i>' : '';
    const arrowIcon = isParent ? '' : '<i class="fas fa-chevron-right menu-item-arrow"></i>';
    
    a.innerHTML = `
        <i class="${icon}"></i>
        <span class="menu-item-text">${section.title}</span>
        ${arrowIcon}
        ${expandIcon}
    `;
    
    // 如果是父级菜单，添加展开/收起功能
    if (isParent) {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 切换展开状态
            li.classList.toggle('expanded');
            
            // 切换图标
            const expandIcon = a.querySelector('.menu-item-expand');
            if (expandIcon) {
                expandIcon.classList.toggle('fa-chevron-down');
                expandIcon.classList.toggle('fa-chevron-up');
            }
            
            // 如果是虚拟父级菜单（没有对应的section），不滚动
            if (section.id.startsWith('parent-')) {
                return;
            }
            
            // 否则滚动到对应区域
            const targetElement = document.getElementById(section.id);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    } else {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除其他活动状态
            document.querySelectorAll('.menu-item a').forEach(item => {
                item.classList.remove('active');
            });
            
            // 添加当前活动状态
            a.classList.add('active');
            currentActiveSection = section.id;
            
            // 滚动到对应区域
            const targetElement = document.getElementById(section.id);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    
    li.appendChild(a);
    
    // 如果有子菜单，创建子菜单容器
    if (isParent && children.length > 0) {
        const subMenu = document.createElement('ul');
        subMenu.classList.add('sub-menu');
        
        children.forEach(childSection => {
            const childIcon = getIconForSection(childSection.title);
            const childMenuItem = createMenuItem(childSection, childIcon, false);
            subMenu.appendChild(childMenuItem);
        });
        
        li.appendChild(subMenu);
    }
    
    return li;
}

// ========== 根据标题获取图标 ==========
function getIconForSection(title) {
    const iconMap = {
        // Telegram工具
        'Telegram工具': 'fab fa-telegram',
        '搜索机器人': 'fas fa-search',
        '搜索': 'fas fa-search',
        '常用机器人': 'fas fa-robot',
        '机器人搭建': 'fas fa-cogs',
        '机器人': 'fas fa-robot',
        'Telegram API': 'fas fa-code',
        'Telegram钱包': 'fas fa-wallet',
        '官方认证': 'fas fa-certificate',
        'Bot': 'fas fa-robot',
        
        // 群组频道
        '群组频道': 'fas fa-users',
        '中文电报群': 'fas fa-comments',
        '英文电报群': 'fas fa-comments',
        '频道': 'fas fa-broadcast-tower',
        'Channel': 'fas fa-broadcast-tower',
        '地区群': 'fas fa-map-marked-alt',
        '社群': 'fas fa-users',
        '群组': 'fas fa-users',
        
        // 机场VPN
        '机场VPN': 'fas fa-plane-departure',
        '机场': 'fas fa-rocket',
        '节点': 'fas fa-server',
        '翻墙': 'fas fa-unlock-alt',
        'VPN': 'fas fa-shield-alt',
        
        // 加密货币
        '加密货币': 'fab fa-bitcoin',
        '交易所': 'fas fa-exchange-alt',
        '币安': 'fab fa-bitcoin',
        '欧易': 'fas fa-coins',
        '推广50U': 'fas fa-dollar-sign',
        '币圈': 'fab fa-bitcoin',
        '虚拟货币': 'fas fa-coins',
        
        // 电话验证
        '电话验证': 'fas fa-phone',
        '开通国际漫游': 'fas fa-globe',
        'TelegramX': 'fab fa-telegram',
        '接码平台': 'fas fa-sms',
        'Giffgaff': 'fas fa-sim-card',
        '手机卡': 'fas fa-sim-card',
        
        // 软件资源
        '软件资源': 'fas fa-layer-group',
        '软件': 'fas fa-laptop-code',
        '脚本': 'fas fa-code',
        '播客': 'fas fa-podcast',
        '媒体': 'fas fa-photo-video',
        
        // 社交媒体
        '社交媒体': 'fas fa-share-alt',
        'Twitter': 'fab fa-twitter',
        'Facebook': 'fab fa-facebook',
        'Instagram': 'fab fa-instagram',
        'YouTube': 'fab fa-youtube',
        
        // 其他分类
        '曝光': 'fas fa-exclamation-triangle',
        '不良': 'fas fa-ban',
        'Scammer': 'fas fa-user-shield',
        '京豆': 'fas fa-seedling',
        '其他': 'fas fa-ellipsis-h',
        
        // 通用分类
        '新闻': 'fas fa-newspaper',
        '资讯': 'fas fa-info-circle',
        '书籍': 'fas fa-book',
        '影视': 'fas fa-film',
        '娱乐': 'fas fa-music',
        '科技': 'fas fa-microchip',
        '游戏': 'fas fa-gamepad',
        '音乐': 'fas fa-music',
        '图片': 'fas fa-images',
        '摄影': 'fas fa-camera',
        '学习': 'fas fa-graduation-cap',
        '教育': 'fas fa-chalkboard-teacher'
    };
    
    for (const [keyword, iconClass] of Object.entries(iconMap)) {
        if (title.includes(keyword)) {
            return iconClass;
        }
    }
    
    return 'fas fa-tag';
}

// ========== 加载数据并渲染 ==========
function loadAndRenderData() {
    fetch('uploaddata.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch uploaddata.md');
            }
            return response.text();
        })
        .then(text => {
            // 分割sections
            const sectionRegex = /^### (.+)$/gm;
            const sections = [];
            let lastIndex = 0;
            let match;
            
            while ((match = sectionRegex.exec(text)) !== null) {
                if (lastIndex < match.index) {
                    const prevSection = {
                        title: sections.length > 0 ? sections[sections.length - 1].title : '其他',
                        content: text.substring(lastIndex, match.index).trim()
                    };
                    if (prevSection.content) {
                        sections.push(prevSection);
                    }
                }
                
                const sectionTitle = match[1].trim();
                const sectionStart = match.index + match[0].length;
                const nextMatch = sectionRegex.exec(text);
                const sectionEnd = nextMatch ? nextMatch.index : text.length;
                
                sections.push({
                    title: sectionTitle,
                    content: text.substring(sectionStart, sectionEnd).trim()
                });
                
                lastIndex = sectionEnd;
                sectionRegex.lastIndex = sectionEnd;
            }
            
            // 处理最后一个section
            if (lastIndex < text.length) {
                const lastSection = {
                    title: sections.length > 0 ? sections[sections.length - 1].title : '其他',
                    content: text.substring(lastIndex).trim()
                };
                if (lastSection.content) {
                    sections.push(lastSection);
                }
            }
            
            // 存储sections数据
            sectionsData = sections;
            
            // 渲染内容
            renderContent(sections);
            
            // 生成导航菜单
            generateNavigationMenu(sections);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = '';
            
            const errorContainer = document.createElement('div');
            errorContainer.style.cssText = 'padding: 40px; text-align: center; color: #999;';
            
            const errorIcon = document.createElement('i');
            errorIcon.className = 'fas fa-exclamation-triangle';
            errorIcon.style.cssText = 'font-size: 3rem; margin-bottom: 20px;';
            
            const errorMsg = document.createElement('p');
            errorMsg.textContent = '加载数据失败，请检查 uploaddata.md 文件是否存在。';
            
            errorContainer.appendChild(errorIcon);
            errorContainer.appendChild(errorMsg);
            contentDiv.appendChild(errorContainer);
        });
}

// ========== 渲染内容 ==========
function renderContent(sections) {
            const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';

    sections.forEach((section, index) => {
        const sectionId = `section-${index}`;
        
        // 在"常用机器人"分类前插入广告位A
        if (section.title === '常用机器人') {
            const adSpaceA = createAdSpaceA();
            contentDiv.appendChild(adSpaceA);
        }

        // 创建section容器
                const sectionContainer = document.createElement('div');
                sectionContainer.classList.add('section-container');
        sectionContainer.id = sectionId;
        
        // 创建标题
        const title = document.createElement('h2');
        title.textContent = section.title;
        sectionContainer.appendChild(title);
        
        // 创建网格容器
                const gridContainer = document.createElement('div');
                gridContainer.classList.add('grid-container');

        // 解析表格数据
        const tableData = parseMarkdownTable(section.content);
        
        // 创建卡片
        tableData.forEach(item => {
            const card = createCard(item);
                            gridContainer.appendChild(card);
        });
        
        // 如果没有数据，显示提示
        if (tableData.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'padding: 40px; text-align: center; color: #999;';
            const inboxIcon = document.createElement('i');
            inboxIcon.className = 'fas fa-inbox';
            inboxIcon.style.cssText = 'font-size: 2rem; margin-bottom: 10px;';
            const emptyText = document.createElement('p');
            emptyText.textContent = '暂无数据';
            emptyMessage.appendChild(inboxIcon);
            emptyMessage.appendChild(emptyText);
            gridContainer.appendChild(emptyMessage);
        }

                sectionContainer.appendChild(gridContainer);
                contentDiv.appendChild(sectionContainer);
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

// ========== 菜单层级配置 ==========
// 智能归类：父级 -> 子级（两层结构）
// 注意：子级名称只需包含关键词即可匹配（使用includes方法）
const menuHierarchy = {
    'Telegram工具': [
        '搜索机器人',
        '常用机器人',
        '机器人搭建',
        'Telegram API',
        'Telegram钱包',
        '官方认证 Bot',
        'Telegram'  // 匹配 "### Telegram"
    ],
    '群组频道': [
        '中文电报群',
        '英文电报群',
        '频道 Channel',
        '频道 channel',  // 小写匹配
        '地区群',
        '社群'
    ],
    '机场VPN': [
        '机场节点',
        '翻墙'
    ],
    '加密货币': [
        '交易所',
        '推广50U',
        '币圈'  // 匹配 "交易所提币或者是购买USDT、币圈撸空投"
    ],
    '电话验证': [
        '开通国际漫游',
        'TelegramX',
        '接码平台',
        'Giffgaff'
    ],
    '软件资源': [
        '软件',
        '脚本',
        '播客',
        '媒体'
    ],
    '社交媒体': [
        'Twitter',
        '各大板块'
    ],
    '其他': [
        '曝光',
        '不良',
        '京豆',
        'Scammer'
    ]
};

// ========== 生成导航菜单 ==========
function generateNavigationMenu(sections) {
    const menu = document.getElementById('menu');
    menu.innerHTML = '';
    
    // 处理层级菜单
    const processedSections = new Set();
    const parentSections = new Map(); // 存储父级section和其子级
    
    // 首先处理父级菜单
    Object.keys(menuHierarchy).forEach(parentName => {
        // 查找父级section，如果找不到则创建虚拟父级
        let parentSection = sections.find(s => s.title.includes(parentName));
        let parentIndex = -1;
        let sectionId;
        
        if (parentSection) {
            parentIndex = sections.indexOf(parentSection);
            sectionId = `section-${parentIndex}`;
            processedSections.add(parentIndex);
        } else {
            // 创建虚拟父级section（没有对应的内容区域）
            sectionId = `parent-${parentName.replace(/\s+/g, '-')}`;
        }
        
        // 收集子级section
        const children = [];
        menuHierarchy[parentName].forEach(childName => {
            const childSection = sections.find(s => s.title.includes(childName));
            if (childSection) {
                const childIndex = sections.indexOf(childSection);
                children.push({
                    id: `section-${childIndex}`,
                    title: childSection.title
                });
                processedSections.add(childIndex);
            }
        });
        
        // 如果找到了父级section，使用父级section
        if (parentSection) {
            parentSections.set(parentIndex, {
                section: {
                    id: sectionId,
                    title: parentSection.title
                },
                children: children
            });
        } else {
            // 创建虚拟父级菜单项
            parentSections.set(-1, {
                section: {
                    id: sectionId,
                    title: parentName
                },
                children: children,
                isVirtual: true
            });
        }
    });
    
    // 首先添加虚拟父级菜单（如果有）
    if (parentSections.has(-1)) {
        const { section: parentSection, children } = parentSections.get(-1);
        const icon = getIconForSection(parentSection.title);
        const menuItem = createMenuItem(parentSection, icon, true, children);
        menu.appendChild(menuItem);
    }
    
    // 生成菜单
    sections.forEach((section, index) => {
        if (processedSections.has(index)) {
            if (parentSections.has(index)) {
                // 这是父级菜单
                const { section: parentSection, children } = parentSections.get(index);
                const icon = getIconForSection(parentSection.title);
                const menuItem = createMenuItem(parentSection, icon, true, children);
                menu.appendChild(menuItem);
            }
            // 子级菜单已经在父级菜单中处理了，跳过
        } else {
            // 普通菜单项
            const sectionId = `section-${index}`;
            const icon = getIconForSection(section.title);
            const menuItem = createMenuItem({
                id: sectionId,
                title: section.title
            }, icon, false);
            menu.appendChild(menuItem);
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
        
        let hasVisibleCards = false;

        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            if (cardText.includes(searchTerm)) {
                card.style.display = 'flex';
                hasVisibleCards = true;
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
    
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('expanded');
        
        // 移动端显示遮罩层
        if (window.innerWidth <= 768) {
            overlay.classList.toggle('active', sidebar.classList.contains('expanded'));
        }
        
        // 保存状态到本地存储（仅桌面端）
        if (window.innerWidth > 768) {
            const isExpanded = sidebar.classList.contains('expanded');
            localStorage.setItem('sidebarExpanded', isExpanded);
        }
    });
    
    // 点击遮罩层关闭侧边栏
    overlay.addEventListener('click', function() {
        sidebar.classList.remove('expanded');
        overlay.classList.remove('active');
    });
    
    // 窗口大小改变时的处理
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
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
