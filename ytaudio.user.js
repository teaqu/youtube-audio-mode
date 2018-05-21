// ==UserScript==
// @name        Youtube Audio Mode
// @version     1.0
// @include     https://www.youtube.com/*
// @license     GPL-3.0+; http://www.gnu.org/licenses/gpl-3.0.txt
// @run-at      document-start
// @grant       GM_xmlhttpRequest
// @grant       GM.setValue
// @grant       GM.getValue
// @noframes
// @downloadURL  https://git.io/vhek9
// ==/UserScript==


(function(open) {
    XMLHttpRequest.prototype.open = function() {
        let video = document.getElementsByTagName('video')[0];
        video.id = window.location.href.match(/v=([^&]*)/)[1];

        // Listen for audio requests
        this.addEventListener("readystatechange", async function() {
            // Get playable url
            let url = this.responseURL.split("&range")[0];

            // Check we want audio
            let isLive = url.includes('live=1');
            let audioMode = await GM.getValue("ytAudioMode", true);
            let isAudioStream = url.includes('audio');

            // If audio stream, set video to that url
            if (audioMode && !isLive && isAudioStream && video.src != url) {
                video.pause();
                video.src = url;
                video.play();
                setPoster(video, ["maxres", "sd", "hq"]);
            }
        }, false);
        open.apply(this, arguments);
    };

    // Add audio mode to the settings menu
    window.addEventListener("load", async function() {
        let audioMode = await GM.getValue("ytAudioMode", true);
        let panel = document.getElementsByClassName("ytp-panel-menu")[0];
        panel.innerHTML += `
            <div class="ytp-menuitem"
                aria-checked="${audioMode}"
                id="audio-mode">
                <div class="ytp-menuitem-label">Audio Mode</div>
                <div class="ytp-menuitem-content">
                    <div class="ytp-menuitem-toggle-checkbox">
                </div>
            </div>`;

        // Toggle audio mode on or off
        let audioToggle = document.getElementById("audio-mode");
        audioToggle.onclick = async function() {
            let audioMode = ! await GM.getValue("ytAudioMode");
            this.setAttribute('aria-checked', audioMode);
            GM.setValue("ytAudioMode", audioMode);
            let video = document.getElementsByTagName('video')[0];

            // Reload page to go back to video with current time
            if ( ! audioMode) {
                let url = window.location.href.split('&t=')
                window.location = url + "&t=" + parseInt(video.currentTime);
            }
        }
    }, false);

    // set the video poster from thumbnails with the best avaliable format
    // https://developers.google.com/youtube/v3/docs/thumbnails
    function setPoster(video, fmts) {
        var img = new Image();
        img.onload = function() {
            // A height 90 is YouTube's not found image.
            if (img.height <= 90) {
                setPoster(video, fmts);
            } else {
                // Background image used as poster does not work on edge with
                // preload.
                video.style.background = `url(${img.src}) no-repeat center`;
                video.style.backgroundSize = 'contain';
            }
        };
        img.src = `//i.ytimg.com/vi/${video.id}/${fmts.shift()}default.jpg`
    }
})(XMLHttpRequest.prototype.open);
