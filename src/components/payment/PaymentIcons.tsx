
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
    <text x="390" y="220" textAnchor="middle" fill="white" fontSize="80" fontWeight="bold" fontFamily="Arial">AMERICAN</text>
    <text x="390" y="320" textAnchor="middle" fill="white" fontSize="80" fontWeight="bold" fontFamily="Arial">EXPRESS</text>
  </svg>
);

export const UnionPayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#002E6E"/>
    <path d="M180 60h140c20 0 30 15 25 40l-65 300c-5 25-25 40-45 40H95c-20 0-30-15-25-40l65-300c5-25 25-40 45-40z" fill="#E21836"/>
    <path d="M310 60h150c20 0 30 15 25 40l-65 300c-5 25-25 40-45 40H225c-20 0-30-15-25-40l65-300c5-25 25-40 45-40z" fill="#00447C"/>
    <path d="M450 60h150c20 0 30 15 25 40l-65 300c-5 25-25 40-45 40H365c-20 0-30-15-25-40l65-300c5-25 25-40 45-40z" fill="#007B84"/>
    <text x="500" y="310" textAnchor="middle" fill="white" fontSize="70" fontWeight="bold" fontFamily="Arial">UnionPay</text>
  </svg>
);

export const DinersClubIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <circle cx="390" cy="250" r="180" fill="none" stroke="#0065A4" strokeWidth="30"/>
    <path d="M310 130v240M310 250h160" stroke="#0065A4" strokeWidth="20" fill="none"/>
  </svg>
);

export const DBBLNexusIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <circle cx="320" cy="200" r="80" fill="#E8308A"/>
    <circle cx="400" cy="200" r="80" fill="#F7941D" opacity="0.8"/>
    <circle cx="360" cy="260" r="80" fill="#00A651" opacity="0.8"/>
    <text x="390" y="420" textAnchor="middle" fill="#333" fontSize="70" fontWeight="bold" fontFamily="Arial">DBBL NEXUS</text>
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
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="130" fontWeight="bold" fontFamily="Arial">নগদ</text>
  </svg>
);

export const RocketIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#8B2F8B"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold" fontFamily="Arial">রকেট</text>
  </svg>
);

export const UpayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#00A651"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="130" fontWeight="bold" fontFamily="Arial">উপায়</text>
  </svg>
);

export const TapIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <circle cx="390" cy="220" r="100" fill="#F7941D"/>
    <text x="390" y="250" textAnchor="middle" fill="white" fontSize="90" fontWeight="bold" fontFamily="Arial">tap</text>
    <text x="390" y="400" textAnchor="middle" fill="#333" fontSize="50" fontFamily="Arial">Trust Axiata Pay</text>
  </svg>
);

export const SurePayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="220" textAnchor="middle" fill="#0066B3" fontSize="70" fontWeight="bold" fontFamily="Arial">শিওরক্যাশ</text>
    <text x="390" y="340" textAnchor="middle" fill="#666" fontSize="50" fontFamily="Arial">SureCash</text>
  </svg>
);

export const MCashIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#D32F2F"/>
    <text x="390" y="250" textAnchor="middle" fill="white" fontSize="100" fontWeight="bold" fontFamily="Arial">M</text>
    <text x="390" y="370" textAnchor="middle" fill="white" fontSize="70" fontFamily="Arial">Cash</text>
  </svg>
);

export const MyCashIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="230" textAnchor="middle" fill="#E91E63" fontSize="80" fontWeight="bold" fontFamily="Arial">MY</text>
    <text x="390" y="340" textAnchor="middle" fill="#4CAF50" fontSize="80" fontWeight="bold" fontFamily="Arial">Cash</text>
  </svg>
);

export const FastCashIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#D32F2F"/>
    <circle cx="390" cy="200" r="80" fill="#4CAF50"/>
    <text x="390" y="225" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial">F</text>
    <text x="390" y="380" textAnchor="middle" fill="white" fontSize="70" fontWeight="bold" fontFamily="Arial">fastcash</text>
  </svg>
);

export const TapNPayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#1565C0"/>
    <text x="390" y="230" textAnchor="middle" fill="white" fontSize="80" fontWeight="bold" fontFamily="Arial">Tap'n</text>
    <text x="390" y="340" textAnchor="middle" fill="#F44336" fontSize="80" fontWeight="bold" fontFamily="Arial">Pay</text>
  </svg>
);

export const CityTouchIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#0D47A1"/>
    <text x="390" y="230" textAnchor="middle" fill="white" fontSize="70" fontWeight="bold" fontFamily="Arial">city</text>
    <text x="390" y="330" textAnchor="middle" fill="#4FC3F7" fontSize="70" fontWeight="bold" fontFamily="Arial">touch</text>
  </svg>
);

export const BracBankIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="230" textAnchor="middle" fill="#D32F2F" fontSize="80" fontWeight="bold" fontFamily="Arial">BRAC</text>
    <text x="390" y="340" textAnchor="middle" fill="#1565C0" fontSize="70" fontWeight="bold" fontFamily="Arial">BANK</text>
  </svg>
);

export const BankAsiaIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <rect x="240" y="120" width="300" height="100" fill="#0D47A1"/>
    <text x="390" y="195" textAnchor="middle" fill="white" fontSize="60" fontWeight="bold" fontFamily="Arial">Bank Asia</text>
    <text x="390" y="350" textAnchor="middle" fill="#0D47A1" fontSize="50" fontFamily="Arial">ব্যাংক এশিয়া</text>
  </svg>
);

export const AgraniBankIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <circle cx="390" cy="220" r="100" fill="#2E7D32"/>
    <text x="390" y="245" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold" fontFamily="Arial">AB</text>
    <text x="390" y="400" textAnchor="middle" fill="#2E7D32" fontSize="50" fontWeight="bold" fontFamily="Arial">Agrani Bank</text>
  </svg>
);

export const ABBankIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#D32F2F"/>
    <text x="390" y="280" textAnchor="middle" fill="white" fontSize="120" fontWeight="bold" fontFamily="Arial">AB</text>
    <circle cx="540" cy="240" r="30" fill="#4CAF50"/>
  </svg>
);

export const MTBIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <rect x="200" y="160" width="380" height="180" fill="#D32F2F" rx="10"/>
    <text x="390" y="280" textAnchor="middle" fill="white" fontSize="100" fontWeight="bold" fontFamily="Arial">MTB</text>
  </svg>
);

export const DeltaBracIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <polygon points="390,100 250,350 530,350" fill="#0D47A1" stroke="#1565C0" strokeWidth="5"/>
    <text x="390" y="450" textAnchor="middle" fill="#0D47A1" fontSize="50" fontWeight="bold" fontFamily="Arial">Delta BRAC</text>
  </svg>
);

export const SBIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="280" textAnchor="middle" fill="#1B5E20" fontSize="150" fontWeight="bold" fontFamily="Arial">SB</text>
    <text x="390" y="400" textAnchor="middle" fill="#666" fontSize="40" fontFamily="Arial">Sonali Bank</text>
  </svg>
);

export const FSIBLIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="210" textAnchor="middle" fill="#0D47A1" fontSize="50" fontWeight="bold" fontFamily="Arial">FIRST SECURITY</text>
    <text x="390" y="300" textAnchor="middle" fill="#0D47A1" fontSize="50" fontWeight="bold" fontFamily="Arial">ISLAMI BANK</text>
    <text x="390" y="400" textAnchor="middle" fill="#666" fontSize="35" fontFamily="Arial">LIMITED</text>
  </svg>
);

export const ModhumotiBankIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="230" textAnchor="middle" fill="#E91E63" fontSize="60" fontWeight="bold" fontFamily="Arial">Modhumoti</text>
    <text x="390" y="330" textAnchor="middle" fill="#333" fontSize="60" fontWeight="bold" fontFamily="Arial">Bank Limited</text>
  </svg>
);

export const OKWalletIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="300" y="280" textAnchor="middle" fill="#4CAF50" fontSize="120" fontWeight="bold" fontFamily="Arial">OK</text>
    <text x="560" y="280" textAnchor="middle" fill="#333" fontSize="70" fontFamily="Arial">wallet</text>
  </svg>
);

export const DmoneyIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="290" textAnchor="middle" fill="#2E7D32" fontSize="100" fontWeight="bold" fontFamily="Arial">Dmoney</text>
  </svg>
);

export const IslamicWalletIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <text x="390" y="240" textAnchor="middle" fill="#F9A825" fontSize="90" fontStyle="italic" fontFamily="serif">Islamic</text>
    <text x="390" y="360" textAnchor="middle" fill="#F9A825" fontSize="70" fontFamily="serif">Wallet</text>
  </svg>
);

export const IPayIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#4CAF50"/>
    <text x="390" y="290" textAnchor="middle" fill="white" fontSize="130" fontStyle="italic" fontWeight="bold" fontFamily="Arial">iPay</text>
  </svg>
);

export const SSLCommerzIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <rect width="780" height="500" rx="40" fill="#1D4B8F"/>
    <text x="390" y="260" textAnchor="middle" fill="#4CAF50" fontSize="90" fontWeight="bold" fontFamily="Arial">SSL</text>
    <text x="390" y="350" textAnchor="middle" fill="white" fontSize="70" fontFamily="Arial">COMMERZ</text>
  </svg>
);

export const PayPalIcon = ({ className = "h-6" }: { className?: string }) => (
  <svg viewBox="0 0 780 500" className={`${iconStyle} ${className}`}>
    <path d="M622.1 139.7c-15.4-17.5-43-25-78.2-25H425.6c-7.2 0-13.3 5.2-14.4 12.3l-49.5 313.5c-.8 5.2 3.2 10 8.5 10h61.6l15.5-98.2-.5 3.1c1.1-7.1 7.2-12.3 14.4-12.3h30c58.8 0 104.8-23.9 118.3-93 .4-2 .7-4 1-5.9 4-25.7-.1-43.2-14.4-57.5" fill="#27346A"/>
    <path d="M646.5 197.2c-13.5 63-53.5 93-118.3 93h-30c-7.2 0-13.3 5.2-14.4 12.3l-19.4 123c-.7 4.5 2.8 8.6 7.3 8.6h51.1c6.3 0 11.6-4.6 12.6-10.8l.5-2.7 10-63.2.6-3.5c1-6.2 6.3-10.8 12.6-10.8h7.9c51.4 0 91.6-20.9 103.4-81.3 4.9-25.2 2.4-46.3-10.6-61.1-3.9-4.5-8.8-8.2-14.3-11.2" fill="#2790C3"/>
    <path d="M611.5 181.9c-4.2-1.2-8.5-2.3-13.1-3.1-4.5-.8-9.3-1.4-14.3-1.8-5-0.4-11.6-.6-18.3-.6H470c-2.6 0-5.1.7-7.2 2-2.4 1.4-4.2 3.7-4.9 6.5l-18.3 115.9-.5 3.4c1.1-7.1 7.2-12.3 14.4-12.3h30c58.8 0 104.8-23.9 118.3-93 .4-2 .7-4 1-5.9-3.6-1.9-7.5-3.5-11.8-4.9l.5-6.2z" fill="#1F264F"/>
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

// Row 1 payment methods (matching reference image top row)
// Row 2 payment methods (matching reference image bottom row)
export const paymentMethods = [
  // Row 1
  { name: 'Visa', Icon: VisaIcon },
  { name: 'Mastercard', Icon: MastercardIcon },
  { name: 'American Express', Icon: AmexIcon },
  { name: 'UnionPay', Icon: UnionPayIcon },
  { name: 'Diners Club', Icon: DinersClubIcon },
  { name: 'DBBL Nexus', Icon: DBBLNexusIcon },
  { name: 'bKash', Icon: BkashIcon },
  { name: 'নগদ', Icon: NagadIcon },
  { name: 'রকেট', Icon: RocketIcon },
  { name: 'উপায়', Icon: UpayIcon },
  { name: 'Tap', Icon: TapIcon },
  { name: 'SureCash', Icon: SurePayIcon },
  { name: 'MCash', Icon: MCashIcon },
  { name: 'MyCash', Icon: MyCashIcon },
  { name: 'FastCash', Icon: FastCashIcon },
  // Row 2
  { name: "Tap'n Pay", Icon: TapNPayIcon },
  { name: 'CityTouch', Icon: CityTouchIcon },
  { name: 'BRAC Bank', Icon: BracBankIcon },
  { name: 'Bank Asia', Icon: BankAsiaIcon },
  { name: 'Agrani Bank', Icon: AgraniBankIcon },
  { name: 'AB Bank', Icon: ABBankIcon },
  { name: 'MTB', Icon: MTBIcon },
  { name: 'Delta BRAC', Icon: DeltaBracIcon },
  { name: 'Sonali Bank', Icon: SBIcon },
  { name: 'FSIBL', Icon: FSIBLIcon },
  { name: 'Modhumoti Bank', Icon: ModhumotiBankIcon },
  { name: 'OK Wallet', Icon: OKWalletIcon },
  { name: 'Dmoney', Icon: DmoneyIcon },
  { name: 'Islamic Wallet', Icon: IslamicWalletIcon },
  { name: 'iPay', Icon: IPayIcon },
  { name: 'COD', Icon: CodIcon },
];

export const SSLCommerzBadge = ({ className = "h-8" }: { className?: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-xs text-primary-foreground/90">Verified By</span>
    <SSLCommerzIcon className={className} />
  </div>
);
