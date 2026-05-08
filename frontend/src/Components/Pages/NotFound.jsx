import React from "react";
import space from "../../assets/Images/space.png";

function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
      <img src={space} />
      {/* <Button>Home</Button> */}
    </div>
  );
}

export default NotFound;
