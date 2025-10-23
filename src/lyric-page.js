// lyric.html専用のスクリプト

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');

    // --- テーマの適用 ---
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleButton.querySelector('.material-symbols-outlined').textContent = 'dark_mode';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleButton.querySelector('.material-symbols-outlined').textContent = 'light_mode';
        }
    }

    function toggleTheme() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }

    // ページ読み込み時に保存されたテーマを適用
    applyTheme(localStorage.getItem('theme') || 'light');

    // ボタンにクリックイベントを追加
    themeToggleButton.addEventListener('click', toggleTheme);


    // --- 歌詞の読み込みと表示 ---
    const LYRICS_BASE_URL = 'https://lyouoda.github.io/lyrics/lyrics/';

    const lyricTitleEl = document.getElementById('lyric-title');
    const lyricArtistEl = document.getElementById('lyric-artist');
    const lyricContentEl = document.getElementById('lyric-content');

    // URLパラメータからファイル名を取得
    const params = new URLSearchParams(window.location.search);
    const filename = params.get('file');

    if (!filename) {
        lyricTitleEl.textContent = 'エラー';
        lyricContentEl.textContent = '表示する歌詞ファイルが指定されていません。';
        return;
    }

    const fetchLyric = async () => {
        try {
            const response = await fetch(LYRICS_BASE_URL + filename);
            if (!response.ok) {
                throw new Error(`ファイルが見つかりません: ${response.status}`);
            }
            const content = await response.text();
            
            // 歌詞ファイルを解析
            const lines = content.split('\n');
            const title = lines[0] || '無題';
            const artist = lines[1] || '';
            const body = lines.slice(3).join('<br>');

            // ページに内容を反映
            document.title = `${title} - マイ・リリックス`; // ブラウザタブのタイトルを更新
            lyricTitleEl.textContent = title;
            lyricArtistEl.textContent = artist;
            lyricContentEl.innerHTML = body;

        } catch (error) {
            lyricTitleEl.textContent = '読み込みエラー';
            lyricContentEl.textContent = error.message;
        }
    };

    fetchLyric();
});