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

  function versionOf(release) { return release.tag_name.replace(/^v/, ""); }
  function asset(release, names) {
    return (release.assets || []).find(x => names.includes(x.name));
  }
  function windowsZip(release, edition) {
    const prefix = edition === "Free" ? `LIRCin-${versionOf(release)}` : `LIRCin-${edition}-${versionOf(release)}`;
    return asset(release, [`${prefix}-self-signed-win-x64.zip`, `${prefix}-win-x64.zip`]);
  }
  function wineArchive(release, edition) {
    const prefix = `LIRCin-${edition}-${versionOf(release)}`;
    return asset(release, [`${prefix}-self-signed-linux-wine.tar.gz`, `${prefix}-linux-wine.tar.gz`]);
  }
  function renderLatestRelease(releases) {
    const release = releases.find(r => windowsZip(r, "Free") || wineArchive(r, "Free"));
    if (!release) return;
    const win = document.getElementById("latest-windows");
    const linux = document.getElementById("latest-linux");
    const note = document.getElementById("latest-build-note");
    const winAsset = windowsZip(release, "Free");
    const linuxAsset = wineArchive(release, "Free");
    if (winAsset) {
      win.href = winAsset.browser_download_url;
      win.textContent = `Free for Windows · ${release.tag_name}`;
    }
    if (linuxAsset) {
      linux.href = linuxAsset.browser_download_url;
      linux.textContent = `Free (Wine) · ${release.tag_name}`;
    } else {
      linux.hidden = true;
    }
    if (note) note.textContent = `${release.prerelease ? "Preview" : "Stable"} · Windows 10/11 · Wine downloads run the Windows app and are not native Linux builds.`;
  }

  // Show current GitHub releases; use a full page so older beta builds do not hide newer uploads.
  const list = document.getElementById("releases");
  if (list || document.getElementById("latest-windows")) {
    fetch(`https://api.github.com/repos/${C.repo}/releases?per_page=100&page=1`).then(r => {
      if (!r.ok) throw new Error("Release list unavailable");
      return r.json();
    }).then(rs => {
      if (!Array.isArray(rs) || !rs.length) throw 0;
      renderLatestRelease(rs);
      if (!list) return;
      list.innerHTML = rs.slice(0, 20).map(r => {
        const assets = r.assets || [];
        const version = versionOf(r);
        const find = name => assets.find(x => x.name === name);
        const editions = [
          { name: "Free", prefix: `LIRCin-${version}` },
          { name: "FreeAds", prefix: `LIRCin-FreeAds-${version}` },
          { name: "Supporter", prefix: `LIRCin-Supporter-${version}` },
          { name: "Pro", prefix: `LIRCin-Pro-${version}` }
        ];
        const links = editions.flatMap(e => {
          const zip = windowsZip(r, e.name);
          const setup = find(`LIRCin-${e.name}-${version}-self-signed-Setup-win-x64.exe`) ||
            find(`LIRCin-${e.name}-${version}-Setup-win-x64.exe`);
          const distribution = find(`LIRCin-${e.name}-${version}-self-signed-win-x64-distribution.zip`) ||
            find(`LIRCin-${e.name}-${version}-win-x64-distribution.zip`);
          const wine = wineArchive(r, e.name);
          const label = e.name === "Free" ? "Free · no ads" : e.name === "FreeAds" ? "FreeAds" : e.name;
          return [
            zip && `<a class="btn sm" href="${zip.browser_download_url}">${label} ZIP</a>`,
            setup && `<a class="btn alt sm" href="${setup.browser_download_url}">${e.name} Setup</a>`,
            distribution && `<a class="btn alt sm" href="${distribution.browser_download_url}">${e.name} Setup ZIP</a>`,
            wine && `<a class="btn alt sm" href="${wine.browser_download_url}">${e.name} Linux (Wine)</a>`
          ].filter(Boolean);
        });
        const checksums = find("SHA256SUMS-self-signed.txt") || find("SHA256SUMS.txt");
        if (checksums) links.push(`<a class="btn alt sm" href="${checksums.browser_download_url}">SHA-256</a>`);
        links.push(`<a class="btn alt sm" href="${r.html_url}">Notes</a>`);
        const freeZip = windowsZip(r, "Free");
        const mb = freeZip ? (freeZip.size / 1048576).toFixed(0) + " MB" : "";
        return `<div class="rel"><div><strong>${r.name || r.tag_name}</strong>
          <span class="pill ${r.prerelease ? "beta" : ""}">${r.prerelease ? "BETA" : "STABLE"}</span>
          ${assets.some(x => x.name.includes("self-signed")) ? '<span class="pill selfsigned">SELF-SIGNED</span>' : ""}<br>
          <small>${new Date(r.published_at).toLocaleDateString()} ${mb ? "· " + mb : ""} · Windows 10/11 x64</small></div>
          <div class="row release-links">${links.join("")}</div></div>`;
      }).join("");
    }).catch(() => {
      if (list) {
        list.innerHTML = `<div class="rel"><div><strong>All releases</strong><br><small>Beta and stable builds</small></div>
          <a class="btn sm" href="https://github.com/${C.repo}/releases">Open releases</a></div>`;
      }
    });
  }
})();
