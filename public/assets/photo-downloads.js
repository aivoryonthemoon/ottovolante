// Native details and download links also work without JavaScript.
const downloads = [...document.querySelectorAll('.photo-download')];

for (const menu of downloads) {
  menu.addEventListener('toggle', () => {
    if (menu.open) {
      for (const other of downloads) if (other !== menu) other.open = false;
    }
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a[download]')) {
      menu.open = false;
      menu.querySelector('summary').focus({ preventScroll: true });
    }
  });
}

document.addEventListener('click', (event) => {
  for (const menu of downloads) if (!menu.contains(event.target)) menu.open = false;
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  for (const menu of downloads) {
    if (!menu.open) continue;
    menu.open = false;
    menu.querySelector('summary').focus({ preventScroll: true });
  }
});
