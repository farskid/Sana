import { Box, Button, ButtonProps, Portal, Text } from "@chakra-ui/react";
import { assertEvent, assign, fromCallback, setup } from "xstate";
import { CaretDownIcon } from "./Icons";
import { useMachine } from "@xstate/react";
import { useMemo, useRef } from "react";
import { cssAnimationDurationAsNumber } from "./utils";
import "./FilterGroup.css";

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
    addAnimationClassName: () => {},
    clearAnimationClassName: () => {},
    addOpeningAnimationClassname: () => {},
    removeOpeningAnimationClassname: () => {},
    addClosingAnimationClassName: () => {},
    removeClosingAnimationClassName: () => {},
    changeKey: assign({
      key: ({ context }) => context.nextKey,
      nextKey: null,
    }),
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
      entry: ["addOpeningAnimationClassname"],
      invoke: {
        src: "listenToCloseAnimateEnd",
      },
      on: {
        "animation ended": {
          target: "dropdown opened",
          actions: "removeOpeningAnimationClassname",
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
              // actions: "focusTriggerElement"
            },
            "open dropdown": {
              target: "animating",
              actions: ["addAnimationClassName", "setNextKey"],
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
              actions: "clearAnimationClassName",
            },
          },
          after: {
            animationDurationHalf: {
              actions: "changeKey",
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

export const FilterGroup = ({
  group,
}: {
  group: Record<string, GroupItem>;
}) => {
  const dropdownContainerRef = useRef<HTMLDivElement>(null!);
  // Remove the unused dropdownContainerShadowRef
  // const dropdownContainerShadowRef = useRef<HTMLDivElement>(null!);

  const animationDuration = cssAnimationDurationAsNumber(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--animation-duration"
    )
  );

  const [state, send] = useMachine(
    filterGroupMachine.provide({
      actions: {
        addAnimationClassName: () => {
          dropdownContainerRef.current.classList.add("animate-blur");
        },
        clearAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove("animate-blur");
        },
        addOpeningAnimationClassname: () => {
          dropdownContainerRef.current.classList.add("animate-opening");
        },
        removeOpeningAnimationClassname: () => {
          dropdownContainerRef.current.classList.remove("animate-opening");
        },
        addClosingAnimationClassName: () => {
          dropdownContainerRef.current.classList.add("animate-closing");
        },
        removeClosingAnimationClassName: () => {
          dropdownContainerRef.current.classList.remove("animate-closing");
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
            () => {
              sendBack({ type: "close dropdown" });
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

  return (
    <Box display="flex" flexDirection="column" gap="4">
      <Box display="flex" gap="2">
        <Text fontWeight="bold">Search</Text>
        <Text color="secondaryText">24 results</Text>
      </Box>
      <Box display="flex" flexDirection="row" gap="3">
        {groupKeys.map((key) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { label, icon, dropdownContent: _, triggerProps } = group[key];
          return (
            <Button
              {...triggerProps}
              key={key}
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
            onClick={(e) => {
              e.stopPropagation();
            }}
            position="absolute"
            bg="white"
            borderRadius="var(--chakra-sizes-roundedBorderRadius)"
            border="1px solid var(--chakra-colors-grayHighlight)"
            shadow="lg"
            hidden={!state.context.key}
            width="300px"
            transition="all var(--animation-duration) ease-in-out"
            overflow="hidden"
            style={{
              top: state.context.triggerPosition
                ? state.context.triggerPosition.top +
                  state.context.triggerPosition.height +
                  10
                : 0,
              left: state.context.triggerPosition
                ? state.context.triggerPosition.left
                : 0,
            }}
          >
            <Box
              overflow="auto"
              maxHeight="400px"
              sx={{
                "&::-webkit-scrollbar": {
                  width: "8px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px",
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
