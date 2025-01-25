import React from "react";
import { ModeToggle } from "./mode-toggle";
const Navbar = () => {
  return (
    <div className="flex justify-between items-center border-b-2 h-10 w-full">
      <div className="border-r-2  py-2 px-4">DataDost</div>
      <div className="border-l-2  px-2">
        <ModeToggle />
      </div>
    </div>
  );
};

export default Navbar;
