import NotificationBell from './NotificationBell';

export default function Header() {
  return (
    <header className="header">
      <div className="header__brand">Bounties</div>
      <nav className="header__nav">
        <NotificationBell />
      </nav>
    </header>
  );
}
