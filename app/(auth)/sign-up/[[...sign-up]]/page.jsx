import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp 
      appearance={{
        elements: {
          formFieldInput__phoneNumber: {
            display: "none",
          },
        },
      }}
    />
  );
}
