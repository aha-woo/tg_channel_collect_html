// ========== 懒加载版本的数据加载脚本 ==========
// 适用于 data.json 超过 1MB 的情况
// 采用按分类拆分 + 懒加载 + 预加载策略

let indexData = null;  // 索引数据
let loadedCategories = {};  // 已加载的分类数据缓存
const DATA_DIR = 'data';  // 数据文件目录
const CACHE_VERSION = '1.0.0';  // 缓存版本号
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;  // 缓存过期时间（24小时）

// ========== 工具函数 ==========

/**
 * 从 localStorage 获取缓存
 */
function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { data, timestamp, version } = JSON.parse(cached);
        
        // 检查版本和过期时间
        if (version !== CACHE_VERSION) return null;
        if (Date.now() - timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            return null;
        }
        
        return data;
    } catch (e) {
        return null;
    }
}

/**
 * 保存数据到 localStorage
 */
function setCachedData(key, data) {
    try {
        const cache = {
            data: data,
            timestamp: Date.now(),
            version: CACHE_VERSION
        };
        localStorage.setItem(key, JSON.stringify(cache));
    } catch (e) {
        console.warn('缓存保存失败:', e);
    }
}

/**
 * 获取缓存 key
 */
function getCacheKey(categoryId) {
    return `tg_nav_category_${categoryId}_${CACHE_VERSION}`;
}

// ========== 加载索引文件 ==========
function loadIndex() {
    return fetch(`${DATA_DIR}/index.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载索引文件');
            }
            return response.json();
        })
        .then(data => {
            indexData = data;
            console.log('索引数据加载成功:', data);
            return data;
        });
}

// ========== 加载分类数据 ==========
function loadCategory(categoryId, useCache = true) {
    // 检查内存缓存
    if (loadedCategories[categoryId]) {
        return Promise.resolve(loadedCategories[categoryId]);
    }
    
    // 检查 localStorage 缓存
    if (useCache) {
        const cached = getCachedData(getCacheKey(categoryId));
        if (cached) {
            loadedCategories[categoryId] = cached;
            console.log(`[缓存] 已加载分类: ${categoryId}`);
            return Promise.resolve(cached);
        }
    }
    
    // 从服务器加载
    const categoryInfo = indexData.categories.find(cat => cat.id === categoryId);
    if (!categoryInfo) {
        return Promise.reject(new Error(`分类不存在: ${categoryId}`));
    }
    
    const filePath = `${DATA_DIR}/${categoryInfo.file}`;
    console.log(`[加载] 正在加载分类: ${categoryId} (${filePath})`);
    
    return fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载分类文件: ${filePath}`);
            }
            return response.json();
        })
        .then(data => {
            // 保存到内存缓存
            loadedCategories[categoryId] = data;
            
            // 保存到 localStorage 缓存
            setCachedData(getCacheKey(categoryId), data);
            
            console.log(`[OK] 分类加载完成: ${categoryId}`);
            return data;
        });
}

// ========== 预加载关键分类 ==========
function preloadCriticalCategories() {
    if (!indexData) return;
    
    const criticalCategories = indexData.categories
        .filter(cat => cat.preload)
        .map(cat => cat.id);
    
    console.log(`[预加载] 开始预加载关键分类: ${criticalCategories.join(', ')}`);
    
    // 并行加载，但不阻塞渲染
    criticalCategories.forEach(categoryId => {
        loadCategory(categoryId, true).catch(err => {
            console.warn(`预加载失败: ${categoryId}`, err);
        });
    });
}

// ========== 合并所有分类数据 ==========
function mergeAllCategories() {
    if (!indexData) return null;
    
    // 合并已加载的分类
    const categories = indexData.categories.map(indexCat => {
        const loadedData = loadedCategories[indexCat.id];
        if (!loadedData) {
            // 如果未加载，返回只有结构的数据
            return {
                id: indexCat.id,
                parentName: indexCat.parentName,
                parentIcon: indexCat.parentIcon,
                children: indexCat.children.map(child => ({
                    name: child.name,
                    icon: child.icon,
                    items: []  // 空数组，表示未加载
                }))
            };
        }
        
        return loadedData;
    });
    
    return {
        meta: indexData.meta,
        categories: categories
    };
}

// ========== 懒加载：滚动到可见区域时加载 ==========
function setupLazyLoading() {
    const observerOptions = {
        root: null,
        rootMargin: '200px',  // 提前200px开始加载
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                // section-{catIndex}-{childIndex} 格式
                const parts = sectionId.split('-');
                if (parts.length >= 2) {
                    const catIndex = parseInt(parts[1]);
                    const category = indexData.categories[catIndex];
                    
                    if (category && !loadedCategories[category.id]) {
                        loadCategory(category.id, true).then(() => {
                            // 重新渲染该分类
                            renderCategory(category.id);
                        }).catch(err => {
                            console.error(`懒加载失败: ${category.id}`, err);
                        });
                    }
                }
            }
        });
    }, observerOptions);
    
    // 观察所有 section 容器
    document.querySelectorAll('.section-container').forEach(section => {
        observer.observe(section);
    });
}

// ========== 渲染单个分类 ==========
function renderCategory(categoryId) {
    const categoryData = loadedCategories[categoryId];
    if (!categoryData) return;
    
    const contentDiv = document.getElementById('content');
    const isAdultVerified = localStorage.getItem('adultVerified') === 'true';
    
    categoryData.children.forEach((child, childIndex) => {
        if (!child.items || child.items.length === 0) return;
        
        const catIndex = indexData.categories.findIndex(cat => cat.id === categoryId);
        const sectionId = `section-${catIndex}-${childIndex}`;
        
        // 检查是否已存在
        const existingSection = document.getElementById(sectionId);
        if (existingSection && child.items.length > 0) {
            // 更新现有 section
            const gridContainer = existingSection.querySelector('.grid-container');
            if (gridContainer) {
                gridContainer.innerHTML = '';
                child.items.forEach(item => {
                    const card = createCard(item);
                    gridContainer.appendChild(card);
                });
            }
        } else {
            // 创建新的 section（使用原有的 renderContent 逻辑）
            // 这里可以复用原有的渲染逻辑
        }
    });
}

// ========== 主加载函数 ==========
function loadAndRenderData() {
    // 显示加载状态
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<div class="loading-skeleton">正在加载...</div>';
    
    // 1. 加载索引文件
    loadIndex()
        .then(() => {
            // 2. 生成导航菜单（使用索引数据）
            generateNavigationMenu();
            
            // 3. 渲染内容（先显示骨架屏）
            renderContentSkeleton();
            
            // 4. 预加载关键分类
            preloadCriticalCategories();
            
            // 5. 加载预加载的分类并渲染
            const preloadCategories = indexData.categories
                .filter(cat => cat.preload)
                .map(cat => cat.id);
            
            if (preloadCategories.length > 0) {
                Promise.all(preloadCategories.map(id => loadCategory(id, true)))
                    .then(() => {
                        renderContent();
                        setupLazyLoading();
                    })
                    .catch(err => {
                        console.error('预加载失败:', err);
                        renderContent();
                    });
            } else {
                renderContent();
                setupLazyLoading();
            }
        })
        .catch(error => {
            console.error('加载数据时出错:', error);
            contentDiv.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载失败，请刷新页面重试</p>
                </div>
            `;
        });
}

// ========== 渲染内容骨架屏 ==========
function renderContentSkeleton() {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    // 添加广告轮播
    const adCarousel = createAdCarousel();
    contentDiv.appendChild(adCarousel);
    
    if (!indexData) return;
    
    const isAdultVerified = localStorage.getItem('adultVerified') === 'true';
    
    indexData.categories.forEach((category, catIndex) => {
        category.children.forEach((child, childIndex) => {
            const sectionId = `section-${catIndex}-${childIndex}`;
            const isPendingCategory = category.parentName === 'TEST A';
            
            // 创建 section 容器
            const sectionContainer = document.createElement('div');
            sectionContainer.classList.add('section-container');
            sectionContainer.id = sectionId;
            
            // 创建标题
            const titleRow = document.createElement('div');
            titleRow.classList.add('section-title-row');
            const title = document.createElement('h2');
            title.textContent = child.name;
            titleRow.appendChild(title);
            sectionContainer.appendChild(titleRow);
            
            // 创建骨架屏网格
            const gridContainer = document.createElement('div');
            gridContainer.classList.add('grid-container', 'skeleton-grid');
            
            // 显示项目数量提示
            const itemCount = child.itemCount || 0;
            if (itemCount > 0) {
                const skeletonInfo = document.createElement('div');
                skeletonInfo.style.cssText = 'padding: 20px; text-align: center; color: #999;';
                skeletonInfo.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 加载中... (${itemCount} 个项目)`;
                gridContainer.appendChild(skeletonInfo);
            }
            
            sectionContainer.appendChild(gridContainer);
            contentDiv.appendChild(sectionContainer);
        });
    });
}

// ========== 修改原有的 renderContent 函数 ==========
// 这里需要复用原有的 renderContent 逻辑，但使用合并后的数据
function renderContent() {
    const mergedData = mergeAllCategories();
    if (!mergedData) return;
    
    // 临时替换 jsonData，使用合并后的数据
    const originalJsonData = window.jsonData;
    window.jsonData = mergedData;
    
    // 调用原有的渲染函数（需要确保 renderContent 函数可用）
    if (typeof renderContentOriginal === 'function') {
        renderContentOriginal();
    } else {
        // 如果没有原函数，使用新的渲染逻辑
        renderContentNew(mergedData);
    }
    
    // 恢复原始数据（如果需要）
    // window.jsonData = originalJsonData;
}

// ========== 新的渲染函数（复用原有逻辑）==========
// 注意：这个函数需要从 script-json.js 中复制 renderContent 的完整逻辑
// 为了简化，这里提供一个适配器，实际使用时应该直接复用原有函数

function renderContentNew(data) {
    // 临时替换全局 jsonData
    const originalJsonData = window.jsonData;
    window.jsonData = data;
    
    // 调用原有的 renderContent 函数
    // 注意：需要确保原有的 renderContent、createCard 等函数都可用
    if (typeof renderContentOriginal !== 'undefined') {
        renderContentOriginal();
    } else {
        // 如果原函数不可用，使用简化版本
        renderContentSimplified(data);
    }
}

// ========== 简化版渲染（仅用于演示）==========
function renderContentSimplified(data) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    // 添加广告轮播（需要确保 createAdCarousel 函数可用）
    if (typeof createAdCarousel === 'function') {
        const adCarousel = createAdCarousel();
        contentDiv.appendChild(adCarousel);
    }
    
    const isAdultVerified = localStorage.getItem('adultVerified') === 'true';
    
    data.categories.forEach((category, catIndex) => {
        category.children.forEach((child, childIndex) => {
            if (!child.items || child.items.length === 0) {
                // 如果未加载，显示加载提示
                if (child.itemCount > 0) {
                    const sectionId = `section-${catIndex}-${childIndex}`;
                    const sectionContainer = document.createElement('div');
                    sectionContainer.classList.add('section-container');
                    sectionContainer.id = sectionId;
                    
                    const titleRow = document.createElement('div');
                    titleRow.classList.add('section-title-row');
                    const title = document.createElement('h2');
                    title.textContent = child.name;
                    titleRow.appendChild(title);
                    sectionContainer.appendChild(titleRow);
                    
                    const gridContainer = document.createElement('div');
                    gridContainer.classList.add('grid-container');
                    const loadingMsg = document.createElement('div');
                    loadingMsg.style.cssText = 'padding: 20px; text-align: center; color: #999;';
                    loadingMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在加载... (${child.itemCount} 个项目)`;
                    gridContainer.appendChild(loadingMsg);
                    sectionContainer.appendChild(gridContainer);
                    contentDiv.appendChild(sectionContainer);
                }
                return;
            }
            
            // 这里应该复用原有的完整渲染逻辑
            // 为了保持代码简洁，建议直接引入原有的 renderContent 函数
        });
    });
}

// ========== 修改侧边栏点击事件 ==========
function setupCategoryClick() {
    document.addEventListener('click', function(e) {
        const menuItem = e.target.closest('.menu-item-parent a');
        if (!menuItem) return;
        
        const categoryName = menuItem.textContent.trim();
        const category = indexData.categories.find(cat => cat.parentName === categoryName);
        
        if (category && !loadedCategories[category.id]) {
            e.preventDefault();
            
            // 显示加载状态
            const contentDiv = document.getElementById('content');
            contentDiv.innerHTML = '<div class="loading-skeleton">正在加载分类数据...</div>';
            
            // 加载分类数据
            loadCategory(category.id, true)
                .then(() => {
                    renderContent();
                })
                .catch(err => {
                    console.error('加载分类失败:', err);
                    contentDiv.innerHTML = '<div class="error-container">加载失败，请重试</div>';
                });
        }
    });
}

// ========== 页面加载完成后执行 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 加载数据
    loadAndRenderData();
    
    // 设置分类点击事件
    setupCategoryClick();
    
    // 其他初始化代码...
    // setupSearch();
    // setupSidebar();
    // setupModals();
});

