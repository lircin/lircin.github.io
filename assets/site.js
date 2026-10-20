(function () {
  const C = window.LIRCIN;
  const nav = `<nav><div class="wrap"><a class="logo" href="index.html"><img src="assets/icon.png" alt="">L'IRC<b>in</b></a><span class="sp"></span>
    <a class="l" href="index.html#features">Features</a><a class="l" href="index.html#editions">Editions</a>
    <a class="l" href="support.html">Support</a><a class="l" href="docs.html">Docs</a>
    <a class="btn sm" href="download.html">Download</a></div></nav>`;
  const foot = `<footer><div class="wrap"><div>© 2026 L'IRCin. All rights reserved. L'IRCin is a trademark of its owner. Not affiliated with mIRC, IceChat or Discord.</div>
    <div><a href="download.html">Download</a> · <a href="support.html">Support</a> · <a href="license.html">License</a> · <a href="privacy.html">Privacy</a> ·
    <a href="https://github.com/${C.repo}">GitHub</a></div></div></footer>`;
  document.body.insertAdjacentHTML("afterbegin", nav);
  document.body.insertAdjacentHTML("beforeend", foot);
  document.querySelectorAll("[data-link]").forEach(a => { a.href = C[a.dataset.link]; });
  document.querySelectorAll("[data-email]").forEach(a => { a.href = "mailto:" + C.email; a.textContent = C.email; });
  const sponsorship = document.getElementById("sponsorship-checkout");
  if (sponsorship) {
    fetch("sponsorship.json").then(r => {
      if (!r.ok) throw new Error("Sponsorship checkout unavailable");
      return r.json();
    }).then(config => {
      if (!config.checkoutUrl) return;
      const url = new URL(config.checkoutUrl);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".gumroad.com") || !url.pathname.startsWith("/l/") ||
          url.username || url.password || url.port) throw new Error("Invalid sponsorship checkout");
      sponsorship.href = url.href;
      sponsorship.hidden = false;
    }).catch(() => {
      sponsorship.replaceWith(document.createTextNode("Sponsorship checkout is not currently available. Contact the seller through Gumroad."));
    });
  }

  // Download page: list GitHub releases (beta vs stable), falls back to the Releases page.
  const list = document.getElementById("releases");
  if (list) {
    fetch(`https://api.github.com/repos/${C.repo}/releases`).then(r => r.json()).then(rs => {
      if (!Array.isArray(rs) || !rs.length) throw 0;
      list.innerHTML = rs.slice(0, 8).map(r => {
        const a = (r.assets || []).find(x => /^LIRCin-\d.*-win-x64\.zip$/i.test(x.name));
        const ads = (r.assets || []).find(x => /^LIRCin-FreeAds-.*-win-x64\.zip$/i.test(x.name));
        const setup = (r.assets || []).find(x => /^LIRCin-Free-\d.*-Setup-win-x64\.exe$/i.test(x.name));
        const adsSetup = (r.assets || []).find(x => /^LIRCin-FreeAds-\d.*-Setup-win-x64\.exe$/i.test(x.name));
        const mb = a ? (a.size / 1048576).toFixed(0) + " MB" : "";
        return `<div class="rel"><div><strong>${r.name || r.tag_name}</strong>
          <span class="pill ${r.prerelease ? "beta" : ""}">${r.prerelease ? "BETA" : "STABLE"}</span><br>
          <small>${new Date(r.published_at).toLocaleDateString()} ${mb ? "· " + mb : ""} · Windows 10/11 x64</small></div>
          <div class="row"><a class="btn sm" href="${a ? a.browser_download_url : r.html_url}">Free (no ads)</a>
          ${ads ? `<a class="btn alt sm" href="${ads.browser_download_url}">Free with sponsorships</a>` : ""}
          ${setup ? `<a class="btn alt sm" href="${setup.browser_download_url}">Free Setup</a>` : ""}
          ${adsSetup ? `<a class="btn alt sm" href="${adsSetup.browser_download_url}">FreeAds Setup</a>` : ""}
          <a class="btn alt sm" href="${r.html_url}">Notes</a></div></div>`;
      }).join("");
    }).catch(() => {
      list.innerHTML = `<div class="rel"><div><strong>All releases</strong><br><small>Beta and stable builds</small></div>
        <a class="btn sm" href="https://github.com/${C.repo}/releases">Open releases</a></div>`;
    });
  }
})();
