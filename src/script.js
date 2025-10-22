// 読み込む歌詞ファイルのリスト（ファイル名から.txtを削除したものがタイトルになる）
// このリストを更新することで、新しい歌詞を追加できます。
const LYRIC_FILENAMES = ['yume.txt', 'kaze.txt', 'monokuro.txt'];
const PROFILE_FILENAME = 'profile.md';

// DOM要素
const lyricsList = document.getElementById('lyrics-list');
const searchInput = document.getElementById('search-input');
const noResults = document.getElementById('no-results');
const modal = document.getElementById('lyric-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const closeModalTopButton = document.getElementById('close-modal-top'); 

const pageHome = document.getElementById('page-home');
const pageProfile = document.getElementById('page-profile');
const profileContent = document.getElementById('profile-content');
const navHome = document.getElementById('nav-home');
const navProfile = document.getElementById('nav-profile');

let currentPage = 'home'; // ページ状態管理

// 非同期: ファイルの内容をフェッチする汎用関数
async function fetchContent(filename) {
    try {
        // ファイルパスを 'lyrics/' やルートから指定 (ファイル配置に合わせる)
        const path = filename === PROFILE_FILENAME ? filename : `lyrics/${filename}`;
        const response = await fetch(path);
        
        if (!response.ok) {
            return `Error loading content: ${response.status} ${response.statusText} (${path})`;
        }
        return await response.text();
    } catch (error) {
        return `Loading error: ${error.message}`;
    }
}

// ページ切り替え関数
async function showPage(page) {
    currentPage = page;
    navHome.classList.remove('border-gray-900', 'border-b-2');
    navProfile.classList.remove('border-gray-900', 'border-b-2');

    if (page === 'home') {
        pageHome.classList.remove('hidden');
        pageProfile.classList.add('hidden');
        navHome.classList.add('border-gray-900', 'border-b-2');
    } else if (page === 'profile') {
        pageHome.classList.add('hidden');
        pageProfile.classList.remove('hidden');
        navProfile.classList.add('border-gray-900', 'border-b-2');
        
        // プロフィール内容をロード
        if (profileContent.textContent === 'Loading profile...') {
            const content = await fetchContent(PROFILE_FILENAME);
            
            // Markdown風のコンテンツを単純なHTMLに変換
            const htmlContent = content
                .replace(/^## (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>') // ##をh3に
                .replace(/^### (.*$)/gim, '<h4 class="text-lg font-medium mt-3 mb-1">$1</h4>') // ###をh4に
                .replace(/\n\n/g, '<br><br>'); // 連続改行を段落区切りに

            profileContent.innerHTML = htmlContent;
        }
    }
}

// 1. 歌詞カードを生成して表示する関数
function renderLyrics(filenames) {
    lyricsList.innerHTML = '';
    
    if (filenames.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }
    noResults.classList.add('hidden');

    filenames.forEach(filename => {
        // ファイル名から '.txt' を削除してタイトルを生成
        const title = filename.replace(/\.txt$/, ''); 

        const card = document.createElement('div');
        card.className = 'lyric-card bg-white p-6 cursor-pointer hover:shadow-lg'; 
        card.setAttribute('data-filename', filename);
        
        card.innerHTML = `
            <h2 class="text-xl font-semibold mb-3">${title}</h2>
            <div class="text-sm text-gray-700 h-10 overflow-hidden relative">
                <p class="lyric-preview">クリックして歌詞を読み込みます...</p>
                <div class="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent"></div>
            </div>
        `;
        
        // クリックでモーダルを開くイベントリスナーを追加
        card.addEventListener('click', () => openModal(filename, title));
        lyricsList.appendChild(card);
    });
}

// 2. 検索機能 (ファイル名/タイトル検索のみ)
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (query === '') {
        renderLyrics(LYRIC_FILENAMES);
        return;
    }

    const filteredData = LYRIC_FILENAMES.filter(filename =>
        filename.replace(/\.txt$/, '').toLowerCase().includes(query) // タイトル (ファイル名) 検索
    );

    renderLyrics(filteredData);
}

// 3. モーダルを開く関数
async function openModal(filename, title) {
    modalTitle.textContent = title;
    modalContent.innerHTML = '<p class="text-gray-500">読み込み中...</p>'; // ローディング表示
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 

    // 歌詞ファイルをフェッチ
    const lyricContent = await fetchContent(filename);
    
    // 歌詞本文を表示 (改行を <br> に変換)
    modalContent.innerHTML = `<div class="lyric-content">${lyricContent.replace(/\n/g, '<br>')}</div>`;

    // アニメーション
    setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    }, 10);
}

// 4. モーダルを閉じる関数
function closeModal() {
    modal.querySelector('div').classList.remove('scale-100');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

// イベントリスナーの設定
searchInput.addEventListener('input', handleSearch);
closeModalTopButton.addEventListener('click', closeModal); 
navHome.addEventListener('click', () => showPage('home'));
navProfile.addEventListener('click', () => showPage('profile'));

// モーダル背景クリックで閉じる
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// ESCキーで閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

// 初期表示
window.onload = () => {
    renderLyrics(LYRIC_FILENAMES);
    showPage('home'); // Homeページを初期表示
};
