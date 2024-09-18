import { Box, ListItemProps } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

export const Menu = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      (
        containerRef.current?.querySelector("[data-menuitem]") as HTMLLIElement
      )?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Box
      py="3"
      px="3"
      ref={containerRef}
      as="ul"
      role="menu"
      onKeyDown={(e) => {
        const menuItems = e.currentTarget.querySelectorAll(
          "[data-menuitem]"
        ) as NodeListOf<HTMLLIElement>;
        let nextIndex = 0;
        // If a menu item is focused, set the next index to the this item's index
        Array.from(menuItems).forEach((item, index) => {
          if (document.activeElement === item) {
            nextIndex = index;
          }
        });
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (e.metaKey) {
            nextIndex = menuItems.length - 1;
          } else {
            nextIndex = (nextIndex + 1) % menuItems.length;
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (e.metaKey) {
            nextIndex = 0;
          } else {
            nextIndex = (nextIndex - 1 + menuItems.length) % menuItems.length;
          }
        }
        menuItems[nextIndex]?.focus();
      }}
    >
      {children}
    </Box>
  );
};

export const MenuItem = ({
  children,
  ...props
}: { children: React.ReactNode } & ListItemProps) => {
  return (
    <Box
      role="menuitem"
      as="li"
      width="full"
      justifyContent="flex-start"
      data-menuitem
      display="flex"
      alignItems="center"
      py="1.5"
      px="3"
      gap="3"
      borderRadius="20px"
      tabIndex={0}
      cursor="pointer"
      _hover={{
        bg: "gray.50",
      }}
      _focus={{
        bg: "grayHighlight",
        outline: "none",
      }}
      _active={{
        bg: "grayHighlightDark",
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
