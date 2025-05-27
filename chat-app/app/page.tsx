import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


// This is a simple chat app UI built with React and Tailwind CSS.

export default function Home() {
  



  return (
    <div className=" flex h-screen w-screen flex-col justify-between bg-background">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <img
            src="
https://avatars.githubusercontent.com/u/1?v=4"
            alt="Avatar"
            className="h-10 w-10 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">John Doe</span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-more-horizontal"
          >
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <img
              src="https://avatars.githubusercontent.com/u/1?v=4"
              alt="Avatar"
              className="h-8 w-8 rounded-full"
            />
            <div className="max-w-xs rounded-lg bg-primary text-primary-foreground p-4">
              <p>Hello! How are you?</p>
            </div>
          </div>
          <div className="flex items-start gap-4 justify-end">
            <div className="max-w-xs rounded-lg bg-secondary text-secondary-foreground p-4">
              <p>I'm good, thanks! How about you?</p>
            </div>
            <img
              src="https://avatars.githubusercontent.com/u/1?v=4"
              alt="Avatar"
              className="h-8 w-8 rounded-full"
            />
          </div>
        </div>
      </div>
      <form className="flex items-center gap-2 border-t p-6">
        <Input
          type="text"
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </form>
      <div className="flex justify-center p-1 text-sm text-muted-foreground">
        <span>Powered by Next.js and Tailwind CSS</span>
      </div>
    </div>
    );
}
