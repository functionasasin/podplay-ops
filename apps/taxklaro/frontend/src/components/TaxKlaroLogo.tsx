interface TaxKlaroLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TaxKlaroLogo({ className, size = 'md' }: TaxKlaroLogoProps) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };
  return (
    <span className={`font-bold tracking-tight ${sizes[size]} ${className ?? ''}`}>
      TaxKlaro
    </span>
  );
}

export default TaxKlaroLogo;
