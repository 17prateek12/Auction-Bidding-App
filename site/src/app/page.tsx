import Login from "@/components/auth-components/Login";
import Registration from "@/components/auth-components/Registration";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4">
      <Tabs defaultValue="signin" className="sm:w-[400px] w-[90%] fixed bg-gray-200 px-4 py-4 rounded-lg shadow-md">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <Login />
      </TabsContent>
      <TabsContent value="signup">
        <Registration />
      </TabsContent>
      </Tabs>
    </div>
  );
}
