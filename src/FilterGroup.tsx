import { Box, Button, ButtonProps, Portal, Text } from "@chakra-ui/react";
import { assertEvent, assign, fromCallback, setup } from "xstate";
import { CaretDownIcon } from "./Icons";
import { useMachine } from "@xstate/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cssAnimationDurationAsNumber } from "./utils";
import "./FilterGroup.css";

// The state machine keeps the visible keys and manages animations and content swapping
const filterGroupMachine = setup({
  types: {
    context: {} as {
      key: string | null;
      nextKey: string | null;
      triggerPosition: DOMRect | null;
    },
    events: {} as
      | {
          type: "open dropdown";
          key: string;
          triggerPosition: DOMRect;
        }
      | { type: "close dropdown" }
      | { type: "animation ended" },
  },
  actors: {
    listenToCloseAnimateEnd: fromCallback(() => {}),
    closeMenuOnEscape: fromCallback(() => {}),
    closeMenuOnClickOutside: fromCallback(() => {}),
  },
  actions: {
    setKey: assign(({ event }) => {
      assertEvent(event, "open dropdown");
      return {
        key: event.key,
        triggerPosition: event.triggerPosition,
      };
    }),
    clearKey: assign({
      key: null,
      nextKey: null,
      triggerPosition: null,
    }),
    setNextKey: assign(({ event }) => {
      assertEvent(event, "open dropdown");
      return {
        nextKey: event.key,
        triggerPosition: event.triggerPosition,
      };
    }),
    addSwapBlurAnimationClassName: () => {},
    removeSwapBlurAnimationClassName: () => {},
    addOpeningAnimationClassName: () => {},
    removeOpeningAnimationClassName: () => {},
    addClosingAnimationClassName: () => {},
    removeClosingAnimationClassName: () => {},
    changeKey: assign({
      key: ({ context }) => context.nextKey,
      nextKey: null,
    }),
    focusTriggerElement: () => {},
  },
  delays: {
    animationDurationHalf: 0,
  },
}).createMachine({
  id: "root",
  initial: "dropdown closed",
  context: {
    key: null,
    nextKey: null,
    triggerPosition: null,
  },
  states: {
    "dropdown closed": {
      on: {
        "open dropdown": {
          target: "opening first time",
          actions: ["setKey"],
        },
      },
    },
    "opening first time": {
      tags: ["menuIndicatorOpen"],
      entry: ["addOpeningAnimationClassName"],
      invoke: {
        src: "listenToCloseAnimateEnd",
      },
      on: {
        "animation ended": {
          target: "dropdown opened",
          actions: "removeOpeningAnimationClassName",
        },
      },
    },
    closing: {
      entry: ["addClosingAnimationClassName"],
      invoke: {
        src: "listenToCloseAnimateEnd",
      },
      on: {
        "animation ended": {
          target: "dropdown closed",
          actions: ["removeClosingAnimationClassName", "clearKey"],
        },
      },
    },
    "dropdown opened": {
      tags: ["menuIndicatorOpen"],
      initial: "idle",
      invoke: [
        {
          id: "closeMenuOnEscape",
          src: "closeMenuOnEscape",
        },
        {
          id: "closeMenuOnClickOutside",
          src: "closeMenuOnClickOutside",
        },
      ],
      states: {
        idle: {
          on: {
            "close dropdown": {
              target: "#root.closing",
              actions: "focusTriggerElement",
            },
            "open dropdown": {
              target: "animating",
              actions: ["addSwapBlurAnimationClassName", "setNextKey"],
              guard: ({ context, event }) => context.key !== event.key,
              description: "Prevent opening the same dropdown twice",
            },
          },
        },
        animating: {
          invoke: {
            src: "listenToCloseAnimateEnd",
          },
          on: {
            "animation ended": {
              target: "idle",
              actions: "removeSwapBlurAnimationClassName",
            },
          },
          after: {
            // Another technique can be to declare another animation in css with half the duration and listen to animationend event on that animation instead of having a fixed delay
            animationDurationHalf: {
              actions: ["changeKey"],
            },
          },
        },
      },
    },
  },
});

interface GroupItem {
  label: string;
  icon: React.ReactElement;
  dropdownContent: React.ReactNode;
  triggerProps?: ButtonProps;
}

interface ContentDimensions {
  width: number;
  height: number;
}

const DROPDOWN_CONTAINER_WIDTH = 300;
const DROPDOWN_CONTAINER_MAX_HEIGHT = 400;

export const FilterGroup = ({
  group,
}: {
  group: Record<string, GroupItem>;
}) => {
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);
  const triggerElementRef = useRef<HTMLButtonElement>(null!);
  const [contentDimensions, setContentDimensions] = useState<
    Record<string, ContentDimensions>
  >({});
  const [nextHiddenKey, setNextHiddenKey] = useState<string | null>(null);

  // In a production environment, we should use the theme's animation duration and keep this consistent within the design system definition
  const animationDuration = cssAnimationDurationAsNumber(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--swap-dropdown-content-animaton-duration"
    )
  );

  const [state, send] = useMachine(
    filterGroupMachine.provide({
      actions: {
        addSwapBlurAnimationClassName: () => {
          dropdownContainerRef.current.classList.add(
            "animate-swap-dropdown-content"
          );
        },
        removeSwapBlurAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove(
            "animate-swap-dropdown-content"
          );
        },
        addOpeningAnimationClassName: () => {
          dropdownContainerRef.current.classList.add(
            "animate-dropdown-opening"
          );
        },
        removeOpeningAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove(
            "animate-dropdown-opening"
          );
        },
        addClosingAnimationClassName: () => {
          dropdownContainerRef.current.classList.add(
            "animate-dropdown-closing"
          );
        },
        removeClosingAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove(
            "animate-dropdown-closing"
          );
        },
        focusTriggerElement: () => {
          triggerElementRef.current.focus();
        },
      },
      actors: {
        closeMenuOnEscape: fromCallback(({ sendBack }) => {
          const ctrl = new AbortController();
          document.addEventListener(
            "keydown",
            (e) => {
              if (e.key === "Escape") {
                sendBack({ type: "close dropdown" });
              }
            },
            { signal: ctrl.signal }
          );
          return () => {
            ctrl.abort();
          };
        }),
        closeMenuOnClickOutside: fromCallback(({ sendBack }) => {
          const ctrl = new AbortController();
          document.addEventListener(
            "click",
            (e) => {
              if (
                e.target instanceof HTMLElement &&
                !dropdownContainerRef.current.contains(e.target)
              ) {
                sendBack({ type: "close dropdown" });
              }
            },
            { signal: ctrl.signal }
          );
          return () => {
            ctrl.abort();
          };
        }),
        listenToCloseAnimateEnd: fromCallback(({ sendBack }) => {
          const ctrl = new AbortController();
          dropdownContainerRef.current.addEventListener(
            "animationend",
            () => {
              sendBack({ type: "animation ended" });
            },
            { signal: ctrl.signal }
          );
          return () => {
            ctrl.abort();
          };
        }),
      },
      delays: {
        animationDurationHalf: animationDuration / 2,
      },
    })
  );

  const groupKeys = useMemo(() => Object.keys(group), [group]);

  useLayoutEffect(() => {
    const newDimensions: Record<string, ContentDimensions> = {};
    groupKeys.forEach((key) => {
      const element = document.getElementById(`hidden-content-${key}`);
      if (element) {
        const { width, height } = element.getBoundingClientRect();
        newDimensions[key] = { width, height };
      }
    });
    setContentDimensions(newDimensions);
  }, [group, groupKeys]);

  const dropdownContainerHeight = useMemo(() => {
    const key = nextHiddenKey ?? state.context.key;
    if (!key) return 0;
    return (
      Math.min(contentDimensions[key]?.height, DROPDOWN_CONTAINER_MAX_HEIGHT) ||
      0
    );
  }, [state.context.key, contentDimensions, nextHiddenKey]);

  return (
    <Box display="flex" flexDirection="column" gap="4">
      {/* Hidden container for pre-rendering content */}
      <Box
        height={0}
        overflow="hidden"
        position="absolute"
        visibility="hidden"
        pointerEvents="none"
      >
        {groupKeys.map((key) => (
          <Box key={key} id={`hidden-content-${key}`}>
            {group[key].dropdownContent}
          </Box>
        ))}
      </Box>

      <Box display="flex" gap="2">
        <Text fontWeight="bold">Search</Text>
        <Text color="secondaryText">24 results</Text>
      </Box>
      <Box display="flex" flexDirection="row" gap="3">
        {groupKeys.map((key) => {
          const { label, icon, triggerProps } = group[key];
          return (
            <Button
              {...triggerProps}
              key={key}
              ref={state.context.key === key ? triggerElementRef : undefined}
              isDisabled={state.matches({ "dropdown opened": "animating" })}
              bg={
                state.context.key === key
                  ? "grayHighlightDark"
                  : "grayHighlight"
              }
              borderRadius="var(--chakra-sizes-roundedBorderRadius)"
              px="4"
              py="2"
              textTransform="capitalize"
              onClick={(e) => {
                send({
                  type: "open dropdown",
                  key,
                  triggerPosition: e.currentTarget.getBoundingClientRect(),
                });
                setNextHiddenKey(key);
              }}
              _focus={{
                shadow: "outline",
              }}
              leftIcon={icon}
              rightIcon={
                <CaretDownIcon
                  style={{
                    transition: `transform var(--opening-closing-animation-duration)`,
                    transform:
                      state.hasTag("menuIndicatorOpen") &&
                      state.context.key === key
                        ? "rotate(180deg)"
                        : "none",
                  }}
                />
              }
            >
              {label}
            </Button>
          );
        })}
        <Portal>
          <Box
            ref={dropdownContainerRef}
            position="absolute"
            bg="white"
            borderRadius="var(--chakra-sizes-roundedBorderRadius)"
            border="1px solid var(--chakra-colors-grayHighlight)"
            shadow="lg"
            hidden={!state.context.key}
            transition="all var(--swap-dropdown-content-animaton-duration) ease-in-out"
            overflow="hidden"
            maxHeight={DROPDOWN_CONTAINER_MAX_HEIGHT}
            width={DROPDOWN_CONTAINER_WIDTH}
            style={{
              top: state.context.triggerPosition
                ? state.context.triggerPosition.top +
                  state.context.triggerPosition.height +
                  10
                : 0,
              left: state.context.triggerPosition
                ? state.context.triggerPosition.left
                : 0,
              height: dropdownContainerHeight + 4,
            }}
          >
            <Box
              overflow="auto"
              height="100%"
              sx={{
                "&::-webkit-scrollbar": {
                  width: "var(--chakra-sizes-scrollbarSize)",
                  borderRadius: "var(--chakra-sizes-scrollbarSize)",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  borderRadius: "var(--chakra-sizes-scrollbarSize)",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                  },
                },
              }}
            >
              {state.context.key && group[state.context.key].dropdownContent}
            </Box>
          </Box>
        </Portal>
      </Box>
    </Box>
  );
};
