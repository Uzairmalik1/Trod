import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar } from "@/components/ui/avatar";
import { Crop, Edit, Grid, Languages, Save, User, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
  clipTitle?: string;
}

export default function Navbar({ selectedTool, setSelectedTool, clipTitle = "Untitled Clip" }: NavbarProps) {
  return (
    <div className="flex items-center justify-between bg-slate50 p-3">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Link href="/home" className="border shadow-md py-2 px-3 font-medium flex items-center justify-center gap-1 rounded-md">
          <ChevronLeft size={20} /> Leave
        </Link>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium">{clipTitle}</h2>
        </div>
      </div>
      
      {/* Center Section */}
      <ToggleGroup type="single" value={selectedTool} onValueChange={setSelectedTool} className="flex rounded bg-bgWhite shadow-md border">
        <ToggleGroupItem
          value="crop"
          className={` ${selectedTool === "crop" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
        >
          <Crop size={20} /> Cropping
        </ToggleGroupItem>
        <ToggleGroupItem
          value="edit"
          className={`p-2 ${selectedTool === "edit" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
        >
          <Edit size={20} /> Edit
        </ToggleGroupItem>
        <ToggleGroupItem
          value="elements"
          className={`p-2 ${selectedTool === "elements" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
        >
          <Grid size={20} /> Elements
        </ToggleGroupItem>
        <ToggleGroupItem
          value="translate"
          className={`p-2 ${selectedTool === "translate" ? "bg-gray-900 text-white" : "bg-white text-black"}`}
        >
          <Languages size={20} /> Auto Translate
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost">Tall Portrait (9:16)</Button>
        <Button variant="default" className="bg-gray-900 text-white">
          Finish demo <Save size={20} />
        </Button>
        <Avatar>
          <User size={20} />
        </Avatar>
      </div>
    </div>
  );
}
