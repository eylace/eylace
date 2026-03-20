import { Layout } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const policies = [
  {
    id: 'commission',
    title: 'কমিশন স্ট্রাকচার',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li><strong>স্ট্যান্ডার্ড কমিশন:</strong> প্রতিটি বিক্রিত পণ্যের উপর ৫-১৫% কমিশন প্রযোজ্য, ক্যাটাগরি অনুযায়ী ভিন্ন হতে পারে।</li>
        <li><strong>ইলেকট্রনিক্স:</strong> ৫-৮%</li>
        <li><strong>ফ্যাশন ও পোশাক:</strong> ১০-১৫%</li>
        <li><strong>গ্রোসারি:</strong> ৩-৫%</li>
        <li><strong>বিউটি ও হেলথ:</strong> ৮-১২%</li>
        <li>প্রিমিয়াম সেলার প্যাকেজে কম কমিশন রেট পাওয়া যায়।</li>
      </ul>
    `,
  },
  {
    id: 'returns',
    title: 'রিটার্ন ও রিফান্ড পলিসি',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>ক্রেতা পণ্য প্রাপ্তির ৭ দিনের মধ্যে রিটার্ন রিকোয়েস্ট করতে পারবেন।</li>
        <li>ত্রুটিপূর্ণ, ভুল বা ক্ষতিগ্রস্ত পণ্যের জন্য সম্পূর্ণ রিফান্ড প্রদান করা হয়।</li>
        <li>রিটার্ন শিপিং খরচ সেলারের দায়িত্ব (যদি পণ্যে ত্রুটি থাকে)।</li>
        <li>রিফান্ড প্রক্রিয়া ৩-৭ কার্যদিবসের মধ্যে সম্পন্ন হয়।</li>
        <li>ডিজিটাল পণ্য ও পার্সোনালাইজড আইটেম রিটার্নযোগ্য নয়।</li>
      </ul>
    `,
  },
  {
    id: 'shipping',
    title: 'শিপিং গাইডলাইন',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>অর্ডার কনফার্মেশনের ২৪-৪৮ ঘণ্টার মধ্যে পণ্য শিপ করতে হবে।</li>
        <li>সকল পণ্যে ট্র্যাকিং নম্বর প্রদান বাধ্যতামূলক।</li>
        <li>Eylace-এর পার্টনার কুরিয়ার ব্যবহার করলে ডিসকাউন্ট রেট পাওয়া যায়।</li>
        <li>ভারী ও বড় পণ্যের জন্য আলাদা শিপিং চার্জ প্রযোজ্য।</li>
        <li>ফ্রি শিপিং অফার সেলার নিজের খরচে প্রদান করতে পারেন।</li>
      </ul>
    `,
  },
  {
    id: 'listing',
    title: 'প্রোডাক্ট লিস্টিং নিয়ম',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>পণ্যের সঠিক বর্ণনা, স্পেসিফিকেশন ও মূল্য দিতে হবে।</li>
        <li>ন্যূনতম ১টি এবং সর্বোচ্চ ৮টি উচ্চ মানের ছবি আপলোড করুন।</li>
        <li>নকল, অবৈধ বা নিষিদ্ধ পণ্য তালিকাভুক্ত করা যাবে না।</li>
        <li>মূল্য বাজারের সাথে সামঞ্জস্যপূর্ণ হতে হবে।</li>
        <li>প্রোডাক্ট টাইটেল স্পষ্ট ও সার্চ-ফ্রেন্ডলি হতে হবে।</li>
      </ul>
    `,
  },
  {
    id: 'payment',
    title: 'পেমেন্ট টার্মস',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>পেমেন্ট সাইকেল: প্রতি ৭ দিন অন্তর (সাপ্তাহিক পেআউট)।</li>
        <li>সমর্থিত পেমেন্ট মেথড: bKash, Nagad, ব্যাংক ট্রান্সফার।</li>
        <li>ন্যূনতম পেআউট পরিমাণ: ৫০০ টাকা।</li>
        <li>রিটার্ন/রিফান্ড পরিমাণ পরবর্তী পেআউট থেকে কাটা হবে।</li>
        <li>পেআউট রিকোয়েস্ট সেলার ড্যাশবোর্ড থেকে করা যায়।</li>
      </ul>
    `,
  },
  {
    id: 'suspension',
    title: 'অ্যাকাউন্ট সাসপেনশন পলিসি',
    content: `
      <ul class="list-disc pl-5 space-y-2">
        <li>নকল পণ্য বিক্রি করলে তাৎক্ষণিক অ্যাকাউন্ট সাসপেন্ড হতে পারে।</li>
        <li>ক্রমাগত নেতিবাচক রিভিউ (২ স্টারের নিচে গড়) পেলে সতর্কতা জারি হবে।</li>
        <li>ডেলিভারি বিলম্ব ৭২ ঘণ্টার বেশি হলে পেনাল্টি আরোপ হবে।</li>
        <li>৩টি সতর্কতার পর অ্যাকাউন্ট সাসপেন্ড করা হতে পারে।</li>
        <li>আপিল প্রক্রিয়া: সাসপেনশনের ১৫ দিনের মধ্যে সেলার সাপোর্টে যোগাযোগ করুন।</li>
      </ul>
    `,
  },
];

const SellerPolicies = () => {
  return (
    <Layout>
      <div className="container-main py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">সেলার পলিসি</h1>
        <p className="text-muted-foreground mb-8">
          Eylace-এ বিক্রি করার জন্য প্রযোজ্য নিয়ম ও শর্তাবলী। অনুগ্রহ করে সকল পলিসি মনোযোগ সহকারে পড়ুন।
        </p>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {policies.map((p) => (
            <AccordionItem key={p.id} value={p.id} className="border rounded-lg px-4">
              <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline">
                {p.title}
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: p.content }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
};

export default SellerPolicies;
