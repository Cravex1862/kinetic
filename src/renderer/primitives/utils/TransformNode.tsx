import React from "react";
import { useParentTransform, combineTransforms, TransformContext, TransformState } from './TransformContext';
import { getTransform3DStyle } from "./styleHelpers";

export interface TransformNodeProps extends TransformState {
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export const TransformNode: React.FC<TransformNodeProps> = ({
    children,
    rotateX,
    rotateY,
    rotateZ,
    perspective,
    translateZ,
    translateX,
    translateY,
    style,
    className = '',
}) => {
    const parentTransform = useParentTransform();
    const accumulatedTransform = combineTransforms(parentTransform, {
        rotateX,
        rotateY,
        rotateZ,
        perspective,
        translateZ,
        translateX,
        translateY,
    });

    const transformStyle = getTransform3DStyle(
        accumulatedTransform.rotateX,
        accumulatedTransform.rotateY,
        accumulatedTransform.rotateZ,
        accumulatedTransform.perspective,
        accumulatedTransform.translateZ,
        accumulatedTransform.translateX,
        accumulatedTransform.translateY,
    );

    return (
        <TransformContext.Provider value={accumulatedTransform}>
            <div style={{ ...style, ...transformStyle }} className={className}>
                {children}
            </div>
        </TransformContext.Provider>
    );
};