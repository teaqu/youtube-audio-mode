// ==UserScript==
// @name        Youtube Audio Mode
// @description Listen to only the audio on YouTube without loading the video.
// @version     1.1
// @include     https://www.youtube.com/*
// @license     GPL-3.0+; http://www.gnu.org/licenses/gpl-3.0.txt
// @run-at      document-start
// @grant       GM_xmlhttpRequest
// @grant       GM.setValue
// @grant       GM.getValue
// @noframes
// @downloadURL  https://git.io/vhek9
// ==/UserScript==


(function(send) {

    // Keep track of the current video
    let videoId;

    XMLHttpRequest.prototype.send = function() {

        // Listen for audio requests
        this.addEventListener("readystatechange", async function() {

            // Add audio mode to the player's to menu
            if (videoId != ytcsi.gt().info.docid) {
                videoId = ytcsi.gt().info.docid;
                addAudoModeToMenu();
            }

            let video = document.getElementsByTagName("video")[0];

            // Set audio
            if (await GM.getValue("ytAudioMode", true)
                && ! this.responseURL.includes("live=1")
                && this.responseURL.includes("audio")
                && ! video.src.includes('audio')
                && videoId
            ) {
                video.pause();
                video.src = this.responseURL.split("&range")[0];
                video.play();

                // Set poster image
                setPoster(video, ["maxres", "sd", "hq"]);
            }
        }, false);
        send.apply(this, arguments);
    };

    // Add audio mode to the settings menu
    async function addAudoModeToMenu() {
        let audioMode = await GM.getValue("ytAudioMode", true);
        let panel = document.getElementsByClassName("ytp-panel-menu")[0];
        if (panel.innerHTML.includes("Audio Mode")) return;

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
            this.setAttribute("aria-checked", audioMode);
            GM.setValue("ytAudioMode", audioMode);
            let video = document.getElementsByTagName("video")[0];

            // Reload page to go back to video
            if ( ! audioMode) {
              location.reload();
            }
        }
    }

    // Set the video poster from thumbnails with the best avaliable format
    // https://developers.google.com/youtube/v3/docs/thumbnails
    function setPoster(video, fmts) {
        let img = new Image();
        img.src = `//i.ytimg.com/vi/${videoId}/${fmts.shift()}default.jpg`
        img.onload = function() {
            // A height 90 is YouTube"s not found image.
            if (img.height <= 90) {
                setPoster(video, fmts);
            } else {
                // Background image used as poster does not work on edge with
                // preload.
                video.style.background = `url(${img.src}) no-repeat center`;
                video.style.backgroundSize = "contain";
            }
        };
    }
})(XMLHttpRequest.prototype.send);