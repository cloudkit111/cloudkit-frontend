import { useEffect } from "react";

const useTitle = (title: string) => {
    useEffect(() => {
        document.title = `Cloudkit | ${title}`
    });
    return null
}

export default useTitle;