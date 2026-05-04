import { memo } from 'react';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © {currentYear} KGC Tour Guide. All rights reserved. Kumudini Govt. College, Tangail.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Built with ❤️ for Bangladesh travelers
        </p>
      </div>
    </footer>
  );
});

export default Footer;
