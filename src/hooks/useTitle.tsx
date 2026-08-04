import { useEffect } from "react";

const useTitle = (title: string) => {
    useEffect(() => {
        document.title = `${title}`
    });
    return null
}

export default useTitle;