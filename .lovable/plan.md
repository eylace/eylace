

## Plan: ফুটারের বাকি সব পেজ তৈরি ও লিংক

### বর্তমান অবস্থা
এই ১১টি রাউট এখনো `CmsPage` (খালি) দেখায়:

### Quick Links (৫টি)
| রাউট | পেজ | বিষয়বস্তু |
|---|---|---|
| `/about` | About Us | কোম্পানি পরিচিতি, মিশন-ভিশন, টিম, পরিসংখ্যান |
| `/contact` | Contact Us | যোগাযোগ ফর্ম, ঠিকানা, ম্যাপ, ফোন/ইমেইল |
| `/careers` | Careers | চাকরির সুবিধা, খোলা পদ তালিকা, আবেদন CTA |
| `/blog` | Blog | ব্লগ পোস্ট কার্ড গ্রিড (mock data), ক্যাটাগরি ফিল্টার |
| `/sitemap` | Sitemap | সাইটের সব লিংক ক্যাটাগরি অনুযায়ী সাজানো |

### Partners (৩টি)
| রাউট | পেজ | বিষয়বস্তু |
|---|---|---|
| `/delivery-partner` | Delivery Partner | ডেলিভারি পার্টনার হওয়ার সুবিধা, যোগদান প্রক্রিয়া, CTA |
| `/affiliate` | Affiliate Program | অ্যাফিলিয়েট কমিশন, কিভাবে কাজ করে, সাইন আপ CTA |
| `/advertise` | Advertise With Us | বিজ্ঞাপন প্যাকেজ, পরিসংখ্যান, যোগাযোগ ফর্ম |

### Bottom Links (৩টি)
| রাউট | পেজ | বিষয়বস্তু |
|---|---|---|
| `/privacy` | Privacy Policy | ডেটা সংগ্রহ, ব্যবহার, সুরক্ষা পলিসি সেকশন |
| `/terms` | Terms & Conditions | ব্যবহারের শর্তাবলী, দায়িত্ব, বিরোধ নিষ্পত্তি |
| `/cookies` | Cookie Policy | কুকি ধরন, ব্যবহার, নিয়ন্ত্রণ |

### ফাইল পরিবর্তন
| ফাইল | পরিবর্তন |
|---|---|
| `src/pages/AboutUs.tsx` | নতুন তৈরি |
| `src/pages/ContactUs.tsx` | নতুন তৈরি |
| `src/pages/Careers.tsx` | নতুন তৈরি |
| `src/pages/Blog.tsx` | নতুন তৈরি |
| `src/pages/Sitemap.tsx` | নতুন তৈরি |
| `src/pages/DeliveryPartner.tsx` | নতুন তৈরি |
| `src/pages/AffiliateProgram.tsx` | নতুন তৈরি |
| `src/pages/AdvertiseWithUs.tsx` | নতুন তৈরি |
| `src/pages/PrivacyPolicy.tsx` | নতুন তৈরি |
| `src/pages/TermsConditions.tsx` | নতুন তৈরি |
| `src/pages/CookiePolicy.tsx` | নতুন তৈরি |
| `src/App.tsx` | ১১টি route আপডেট — CmsPage → নতুন কম্পোনেন্ট |

সব পেজ `Layout` কম্পোনেন্ট ব্যবহার করবে, প্রফেশনাল ডিজাইন হবে hero section + content sections সহ।

