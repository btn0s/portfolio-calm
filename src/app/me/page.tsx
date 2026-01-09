import Image from "next/image";
import me from "@/assets/images/me.png";

const Page = () => {
  return (
    <section>
      <h1>say cheese</h1>
      <Image src={me} alt="Me" className="w-96" />
    </section>
  );
};

export default Page;
