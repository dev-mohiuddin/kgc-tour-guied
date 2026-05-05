import { memo } from 'react';

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6 md:py-0 hidden md:block">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © {currentYear} Tour Guide. All rights reserved.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Built with ❤️ by{' '}
          <a
            href="https://web.facebook.com/mohiuddin.mern.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Mohiuddin
          </a>{' '}
          for Bangladesh travelers
        </p>
      </div>
    </footer>
  );
});

export default Footer;
