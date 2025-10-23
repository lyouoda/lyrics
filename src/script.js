// 設定
const MANIFEST_URL = 'https://lyouoda.github.io/lyrics/lyrics/manifest.json'; // 歌詞リストのJSON
const LYRICS_BASE_URL = 'https://lyouoda.github.io/lyrics/lyrics/';
const PROFILE_URL = 'https://lyouoda.github.io/lyrics/profile.md'; // プロフィールファイルの絶対URL

// グローバル変数
/**
 * @type {Array<{filename: string, title: string, artist: string, content: string, preview: string}>}
 * 全ての歌詞データを保持する配列
 */
let ALL_LYRICS_DATA = [];
let currentPage = 'home'; // ページ状態管理

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

// 歌詞リスト(manifest.json)を読み込む
async function fetchLyricManifest() {
    try {
        const response = await fetch(MANIFEST_URL);
        if (!response.ok) {
            console.error('Manifest file not found:', response.statusText);
            return [];
        }
        const data = await response.json();
        return data.files || []; // manifest.jsonに "files": [...] があることを期待
    } catch (error) {
        console.error('Error fetching manifest:', error);
        return [];
    }
}

// 非同期: ファイルの内容をフェッチする汎用関数
async function fetchContent(filename) {
    try {
        let path;

        if (filename === PROFILE_URL) {
            // プロフィールはサイトのルートからフェッチ
            path = PROFILE_URL;
        } else {
            // 歌詞ファイルは外部URLからフェッチ
            // 例: https://lyouoda.github.io/lyrics/lyrics/yume.txt
            path = LYRICS_BASE_URL + filename;
        }

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
    if (currentPage === page && page === 'profile' && profileContent.innerHTML !== '<p>Loading profile...</p>') return;

    currentPage = page;
    navHome.classList.remove('active');
    navProfile.classList.remove('active');

    if (page === 'home') {
        pageHome.classList.remove('hidden');
        pageProfile.classList.add('hidden');
        navHome.classList.add('active');
    } else if (page === 'profile') {
        pageHome.classList.add('hidden');
        pageProfile.classList.remove('hidden');
        navProfile.classList.add('active');
        // プロフィール内容をロード
        if (profileContent.textContent === 'Loading profile...') {
            // profile.md はローカルから読み込む
            const content = await fetchContent(PROFILE_URL);

            // 簡易的なMarkdownパーサー
            const htmlContent = content
                .replace(/^## (.*$)/gim, '<h3>$1</h3>') // ##をh3に
                .replace(/^### (.*$)/gim, '<h4>$1</h4>') // ###をh4に
                // [text](url) を <a href="url" target="_blank">text</a> に変換
                .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                .replace(/\n\n/g, '<br><br>'); // 連続改行を段落区切りに

            profileContent.innerHTML = htmlContent;
        }
    }
}

// 歌詞カードを生成して表示する関数
function renderLyrics(lyrics) {
    lyricsList.innerHTML = '';
    
    if (lyrics.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }
    noResults.classList.add('hidden');

    lyrics.forEach(lyric => {
        const card = document.createElement('div');
        card.className = 'lyric-card'; 
        card.setAttribute('data-filename', lyric.filename);
        
        card.innerHTML = `
            <h3 class="lyric-card-title">${lyric.title || '無題'}</h3>
            <p class="lyric-preview">${lyric.preview || 'クリックして歌詞を読み込みます...'}</p>
        `;
        
        // クリックでモーダルを開くイベントリスナーを追加
        card.addEventListener('click', () => openModal(lyric.filename, lyric.title));
        lyricsList.appendChild(card);
    });
}

// 検索機能
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (query === '') {
        renderLyrics(ALL_LYRICS_DATA);
        return;
    }

    const filteredData = ALL_LYRICS_DATA.filter(lyric => {
        return lyric.title.toLowerCase().includes(query) || lyric.content.toLowerCase().includes(query);
    }
    );

    renderLyrics(filteredData);
}

// モーダルを開く関数
function openModal(filename, title) {
    modalTitle.textContent = title;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 

    // 初期化時に読み込んだデータから該当の歌詞を検索
    const lyricData = ALL_LYRICS_DATA.find(lyric => lyric.filename === filename);

    if (lyricData) {
        // 取得済みの歌詞本文を表示 (改行を <br> に変換)
        modalContent.innerHTML = lyricData.content.replace(/\n/g, '<br>');
    } else {
        // データが見つからない場合のエラー表示
        modalContent.innerHTML = '<p>エラー: 歌詞データを読み込めませんでした。</p>';
    }
}

// モーダルを閉じる関数
function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// イベントリスナーの設定
searchInput.addEventListener('input', handleSearch);
closeModalTopButton.addEventListener('click', closeModal); 
navHome.addEventListener('click', (e) => { e.preventDefault(); showPage('home'); });
navProfile.addEventListener('click', (e) => { e.preventDefault(); showPage('profile'); });

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
async function initialize() {
    const filenames = await fetchLyricManifest();
    
    // 各歌詞ファイルの内容を全て取得し、データ構造を構築
    const lyricsDataPromises = filenames.map(async (filename) => {
        const content = await fetchContent(filename);
        const lines = content.split('\n');
        
        // 1行目をタイトル、2行目をアーティストとして解釈
        const title = lines[0] || filename.replace(/\.txt$/, '');
        const artist = lines[1] || '';
        // 歌詞本文（4行目以降）からプレビューを生成
        const bodyLines = lines.slice(3);
        const preview = bodyLines.slice(0, 2).join('<br>');

        return { filename, title, artist, content, preview };
    });

    ALL_LYRICS_DATA = await Promise.all(lyricsDataPromises);

    renderLyrics(ALL_LYRICS_DATA);
    showPage('home'); // Homeページを初期表示
}

document.addEventListener('DOMContentLoaded', initialize);
