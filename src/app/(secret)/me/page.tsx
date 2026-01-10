import Image from "next/image";
import me from "@/assets/images/me.png";
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'me',
  description: 'Photo of bt norris, design engineer',
  path: '/me',
})

const Page = () => {
  return (
    <section>
      <h1>say cheese</h1>
      <Image src={me} alt="Me" className="w-96" />
    </section>
  );
};

export default Page;
