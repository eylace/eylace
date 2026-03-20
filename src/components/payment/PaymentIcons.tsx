
const iconStyle = "h-full w-auto";

export const VisaIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <path d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7z" fill="#1434CB"/>
    <path d="M541.3 156.5c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.5-90.2 64.5-.3 28.1 26.5 43.7 46.8 53.1 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.2 93-66.7.2-22.2-14-39.1-44.8-53.1-18.7-9-30.1-15.1-30-24.2 0-8.1 9.7-16.8 30.6-16.8 17.4-.3 30.1 3.5 39.9 7.5l4.8 2.3 7.2-42.7z" fill="#1434CB"/>
    <path d="M636.5 153h-41.3c-12.8 0-22.4 3.5-28 16.2l-79.4 179.5h56.2s9.2-24.1 11.3-29.4c6.1 0 60.8.1 68.6.1 1.6 6.9 6.5 29.3 6.5 29.3H680l-43.5-195.7zm-65.9 126.3c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.6h-44.6z" fill="#1434CB"/>
    <path d="M247.1 153l-52.3 133.4-5.6-27c-9.7-31.2-39.9-65-73.7-81.9l47.9 171h56.6l84.3-195.7h-57.2z" fill="#1434CB"/>
    <path d="M146.9 153H60.1l-.7 3.8c67.1 16.2 111.5 55.3 129.9 102.3L171.1 169c-3.2-12.4-12.7-15.7-24.2-16z" fill="#F9A533"/>
  </svg>
);

export const MastercardIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <circle cx="312" cy="250" r="170" fill="#EB001B"/>
    <circle cx="468" cy="250" r="170" fill="#F79E1B"/>
    <path d="M390 113.4c-41.6 32.7-68.3 83.3-68.3 140.6s26.7 107.9 68.3 140.6c41.6-32.7 68.3-83.3 68.3-140.6s-26.7-107.9-68.3-140.6z" fill="#FF5F00"/>
  </svg>
);

export const AmexIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#2E77BC"/>
    <text x="390" y="280" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold" fontFamily="Arial">AMEX</text>
  </svg>
);

export const PayPalIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <path d="M622.1 139.7c-15.4-17.5-43-25-78.2-25H425.6c-7.2 0-13.3 5.2-14.4 12.3l-49.5 313.5c-.8 5.2 3.2 10 8.5 10h61.6l15.5-98.2-.5 3.1c1.1-7.1 7.2-12.3 14.4-12.3h30c58.8 0 104.8-23.9 118.3-93 .4-2 .7-4 1-5.9 4-25.7-.1-43.2-14.4-57.5" fill="#27346A"/>
    <path d="M646.5 197.2c-13.5 63-53.5 93-118.3 93h-30c-7.2 0-13.3 5.2-14.4 12.3l-19.4 123c-.7 4.5 2.8 8.6 7.3 8.6h51.1c6.3 0 11.6-4.6 12.6-10.8l.5-2.7 10-63.2.6-3.5c1-6.2 6.3-10.8 12.6-10.8h7.9c51.4 0 91.6-20.9 103.4-81.3 4.9-25.2 2.4-46.3-10.6-61.1-3.9-4.5-8.8-8.2-14.3-11.2" fill="#2790C3"/>
    <path d="M611.5 181.9c-4.2-1.2-8.5-2.3-13.1-3.1-4.5-.8-9.3-1.4-14.3-1.8-5-0.4-11.6-.6-18.3-.6H470c-2.6 0-5.1.7-7.2 2-2.4 1.4-4.2 3.7-4.9 6.5l-18.3 115.9-.5 3.4c1.1-7.1 7.2-12.3 14.4-12.3h30c58.8 0 104.8-23.9 118.3-93 .4-2 .7-4 1-5.9-3.6-1.9-7.5-3.5-11.8-4.9l.5-6.2z" fill="#1F264F"/>
  </svg>
);

export const BkashIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#E2136E"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="140" fontWeight="bold" fontFamily="Arial">bKash</text>
  </svg>
);

export const NagadIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#F6921E"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="130" fontWeight="bold" fontFamily="Arial">Nagad</text>
  </svg>
);

export const RocketIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#8B2F8B"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold" fontFamily="Arial">Rocket</text>
  </svg>
);

export const UpayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#00A651"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="140" fontWeight="bold" fontFamily="Arial">Upay</text>
  </svg>
);

export const SSLCommerzIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#1D4B8F"/>
    <text x="390" y="260" textAnchor="middle" fill="#4CAF50" fontSize="90" fontWeight="bold" fontFamily="Arial">SSL</text>
    <text x="390" y="350" textAnchor="middle" fill="white" fontSize="70" fontFamily="Arial">COMMERZ</text>
  </svg>
);

export const UnionPayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#002E6E"/>
    <path d="M180 60h140c20 0 30 15 25 40l-65 300c-5 25-25 40-45 40H95c-20 0-30-15-25-40l65-300c5-25 25-40 45-40z" fill="#E21836"/>
    <path d="M310 60h150c20 0 30 15 25 40l-65 300c-5 25-25 40-45 40H225c-20 0-30-15-25-40l65-300c5-25 25-40 45-40z" fill="#00447C"/>
    <path d="M450 60h150c20 0 30 15 25 40l-65 300c-5 25-25 40-45 40H365c-20 0-30-15-25-40l65-300c5-25 25-40 45-40z" fill="#007B84"/>
    <text x="500" y="310" textAnchor="middle" fill="white" fontSize="80" fontWeight="bold" fontFamily="Arial">UnionPay</text>
  </svg>
);

export const ApplePayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#000"/>
    <text x="390" y="300" textAnchor="middle" fill="white" fontSize="130" fontFamily="Arial">
      <tspan fontWeight="300"> Pay</tspan>
    </text>
    <path d="M270 160c10-12 17-29 15-46-15 1-33 10-43 22-10 11-18 29-16 46 17 1 34-9 44-22z" fill="white"/>
    <path d="M285 206c-24-1-45 14-56 14s-30-13-50-13c-26 0-49 15-62 38-27 46-7 114 19 151 13 19 28 39 49 39 19-1 27-13 50-13s30 13 50 13 34-19 47-39c15-22 21-43 21-44-1-1-41-16-41-62 0-39 31-57 33-59-18-27-46-30-56-30z" fill="white"/>
  </svg>
);

export const GooglePayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="440" y="300" textAnchor="middle" fill="#5f6368" fontSize="120" fontWeight="500" fontFamily="Arial">Pay</text>
    <g transform="translate(190, 175) scale(0.6)">
      <path d="M255.2 218.8l-130-130c-6.6-6.6-6.6-17.4 0-24l6.8-6.8c6.6-6.6 17.4-6.6 24 0l103.2 103.2L362.4 58c6.6-6.6 17.4-6.6 24 0l6.8 6.8c6.6 6.6 6.6 17.4 0 24l-130 130c-3.3 3.3-7.6 5-12 5s-8.7-1.7-12-5z" fill="#4285F4" transform="rotate(180, 200, 140) scale(0.4) translate(100, 50)"/>
      <circle cx="80" cy="130" r="60" fill="#EA4335"/>
      <circle cx="80" cy="130" r="30" fill="#fff"/>
      <path d="M80 100v60" stroke="#EA4335" strokeWidth="18"/>
      <path d="M80 100c33 0 60 27 60 60h-60z" fill="#FBBC04"/>
      <path d="M80 160c-33 0-60-27-60-60h60z" fill="#34A853"/>
      <path d="M140 160c0 33-27 60-60 60v-60z" fill="#4285F4"/>
    </g>
  </svg>
);

export const CodIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#2D8B4E"/>
    <text x="390" y="280" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold" fontFamily="Arial">COD</text>
    <text x="390" y="370" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="50" fontFamily="Arial">Cash on Delivery</text>
  </svg>
);

export const JcbIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <rect x="200" y="100" width="120" height="300" rx="20" fill="#0B4EA2"/>
    <rect x="330" y="100" width="120" height="300" rx="20" fill="#BF1E2D"/>
    <rect x="460" y="100" width="120" height="300" rx="20" fill="#098A45"/>
    <text x="260" y="280" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial">J</text>
    <text x="390" y="280" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial">C</text>
    <text x="520" y="280" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial">B</text>
  </svg>
);

export const DiscoverIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <path d="M0 250h780" stroke="#F47216" strokeWidth="180" opacity="0.15"/>
    <text x="390" y="280" textAnchor="middle" fill="#231F20" fontSize="100" fontWeight="bold" fontFamily="Arial">DISCOVER</text>
    <circle cx="560" cy="250" r="50" fill="#F47216"/>
  </svg>
);

export const paymentMethods = [
  { name: 'Visa', Icon: VisaIcon },
  { name: 'Mastercard', Icon: MastercardIcon },
  { name: 'American Express', Icon: AmexIcon },
  { name: 'UnionPay', Icon: UnionPayIcon },
  { name: 'JCB', Icon: JcbIcon },
  { name: 'Discover', Icon: DiscoverIcon },
  { name: 'PayPal', Icon: PayPalIcon },
  { name: 'Apple Pay', Icon: ApplePayIcon },
  { name: 'Google Pay', Icon: GooglePayIcon },
  { name: 'bKash', Icon: BkashIcon },
  { name: 'Nagad', Icon: NagadIcon },
  { name: 'Rocket', Icon: RocketIcon },
  { name: 'Upay', Icon: UpayIcon },
  { name: 'SSLCommerz', Icon: SSLCommerzIcon },
  { name: 'COD', Icon: CodIcon },
];
