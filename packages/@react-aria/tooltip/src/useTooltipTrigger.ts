/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {FocusEvents} from '@react-types/shared';
import {getInteractionModality, HoverProps, isFocusVisible, PressProps, usePress} from '@react-aria/interactions';
import {HTMLAttributes, RefObject, useEffect, useRef} from 'react';
import {mergeProps, useId} from '@react-aria/utils';
import {TooltipTriggerProps} from '@react-types/tooltip';
import {TooltipTriggerState} from '@react-stately/tooltip';
import {useFocusable} from '@react-aria/focus';
import {useHover} from '@react-aria/interactions';

interface TooltipTriggerAria {
  triggerProps: HTMLAttributes<HTMLElement> & PressProps & HoverProps & FocusEvents,
  tooltipProps: HTMLAttributes<HTMLElement>
}

export function useTooltipTrigger(props: TooltipTriggerProps, state: TooltipTriggerState, ref: RefObject<HTMLElement>) : TooltipTriggerAria {
  let {
    isDisabled
  } = props;

  let tooltipId = useId();

  let isHovered = useRef(false);
  let isFocused = useRef(false);

  let handleShow = () => {
    if (isHovered.current || isFocused.current) {
      state.open(isFocused.current);
    }
  };

  let handleHide = () => {
    if (!isHovered.current && !isFocused.current) {
      state.close();
    }
  };

  useEffect(() => {
    let onKeyDown = (e) => {
      if (ref && ref.current) {
        // Escape after clicking something can give it keyboard focus
        // dismiss tooltip on esc key press
        if (e.key === 'Escape') {
          state.close();
        }
      }
    };
    if (state.isOpen) {
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [ref, state]);

  let onHoverStart = () => {
    if (getInteractionModality() === 'pointer') {
      isHovered.current = true;
    } else {
      isHovered.current = false;
    }
    handleShow();
  };

  let onHoverEnd = () => {
    // no matter how the trigger is left, we should close the tooltip
    isFocused.current = false;
    isHovered.current = false;
    handleHide();
  };

  let onPressStart = () => {
    // no matter how the trigger is pressed, we should close the tooltip
    isFocused.current = false;
    isHovered.current = false;
    handleHide();
  };

  let onFocus = () => {
    let isVisible = isFocusVisible();
    if (isVisible) {
      isFocused.current = true;
      handleShow();
    }
  };

  let onBlur = () => {
    isFocused.current = false;
    isHovered.current = false;
    handleHide();
  };

  let {hoverProps} = useHover({
    isDisabled,
    onHoverStart,
    onHoverEnd
  });

  let {pressProps} = usePress({onPressStart});

  let {focusableProps} = useFocusable({
    isDisabled,
    onFocus,
    onBlur
  }, ref);

  return {
    triggerProps: {
      'aria-describedby': state.open ? tooltipId : undefined,
      ...mergeProps(focusableProps, hoverProps, pressProps)
    },
    tooltipProps: {
      id: tooltipId
    }
  };
}
