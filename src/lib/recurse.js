export const RECURSE_PROCEED = 0;
export const RECURSE_SKIP_SUBTREE = 1;
export const RECURSE_STOP_ITERATION = 2;

export function recurse(getChildren) {
    return function recurse(node, pre, post) {
        if (pre)
            switch (pre(node)) {
                case RECURSE_SKIP_SUBTREE:
                    return RECURSE_PROCEED;
                case RECURSE_STOP_ITERATION:
                    return RECURSE_STOP_ITERATION;
            }

        const children = getChildren(node);
        if (children)
            for (const childNode of children)
                switch (recurse(childNode, pre, post)) {
                    case RECURSE_SKIP_SUBTREE:
                        return RECURSE_PROCEED;
                    case RECURSE_STOP_ITERATION:
                        return RECURSE_STOP_ITERATION;
                }

        if (post)
            switch (post(node)) {
                case RECURSE_STOP_ITERATION:
                    return RECURSE_STOP_ITERATION;
            }

        return RECURSE_PROCEED;
    };
}
