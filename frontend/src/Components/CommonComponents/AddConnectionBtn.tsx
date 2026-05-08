// import { cn } from "MagicUI/utils";
import clsx from "clsx";
import React, { useState, forwardRef } from "react";
import { Trash } from "lucide-react";
import { Modal } from "antd";
import { useSelector } from "react-redux";

const Square = forwardRef<
  HTMLDivElement,
  {
    className?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
    type?: string;
    onDelete?: () => void;
  }
>(({ className, children, onClick, style, type, onDelete }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const sourceId = useSelector((state: any) => state.connection.sourceId);
  const sourceImages = useSelector(
    (state: any) => state.connection.sourceImages
  );

  const showDeleteConfirm = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    if (onDelete) {
      onDelete();
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className={`flex ${type === "Destination" && "gap-1"}`}>
      {/* <div
        onClick={onClick}
        style={style}
        ref={ref}
        className={cn(
          "relative flex w-[92px] h-[92px] items-center justify-center rounded-md border-2 bg-white p-3",
          className
        )}
      >
        {children}
      </div> */}
      <div
        onClick={onClick}
        style={style}
        ref={ref}
        className={clsx(
          "relative flex w-[92px] h-[92px] items-center justify-center rounded-md bg-white p-3",
          className
        )}>
        {children}
      </div>
      {type === "Destination" && (sourceId || sourceImages.length == 1) && (
        <>
          <Trash
            size={18}
            color="#EA4648"
            style={{ cursor: "pointer", zIndex: 10, marginTop: 2 }}
            onClick={showDeleteConfirm}
          />
          <Modal
            title="Delete Connection"
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="Confirm"
            cancelText="Cancel"
            okButtonProps={{
              style: {
                backgroundColor: "#576CC4",
                borderColor: "#576CC4",
                color: "white",
              },
            }}>
            <p>Are you sure you want to delete this connection?</p>
          </Modal>
        </>
      )}
    </div>
  );
});

Square.displayName = "Square";

export default Square;
