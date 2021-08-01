import { Remote } from 'electron'
export default (remote:Remote) => {
  const items:Array<Electron.MenuItemConstructorOptions> = [
    { label: 'すべて選択', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
    { label: 'カット', accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: 'コピー', accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: 'ペースト', accelerator: 'CmdOrCtrl+V', role: 'paste' }
  ]

  const Menu = remote.Menu
  const MenuItem = remote.MenuItem
  const menu = new Menu()
  for (const ctxMenuItem of items) {
    menu.append(new MenuItem(ctxMenuItem))
  }
  return menu
}