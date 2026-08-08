import { BaseMotionProps } from '../types';
import React, { createContext, useContext } from "react";
import { getTransform3DStyle } from "./styleHelpers";

export interface TransformState {
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    perspective?: number;
    translateZ?: number;
    translateX?: number;
    translateY?: number;
}

export const TransformContext = createContext<TransformState | null>(null);

export const useParentTransform = (): TransformState | null => {
    return useContext(TransformContext);
}

export const combineTransforms = (
    parentTransform?: TransformState | null,
    childTransform?: TransformState
): TransformState => {
    if (!parentTransform) {
        return childTransform || {};
    }

    return {
        rotateX: (parentTransform.rotateX || 0) + (childTransform?.rotateX || 0),
        rotateY: (parentTransform.rotateY || 0) + (childTransform?.rotateY || 0),
        rotateZ: (parentTransform.rotateZ || 0) + (childTransform?.rotateZ || 0),
        translateZ: (parentTransform.translateZ || 0) + (childTransform?.translateZ || 0),
        translateX: (parentTransform.translateX || 0) + (childTransform?.translateX || 0),
        translateY: (parentTransform.translateY || 0) + (childTransform?.translateY || 0),
        perspective: childTransform?.perspective || parentTransform.perspective || 1000,
    };
};

