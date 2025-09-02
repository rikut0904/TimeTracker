import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768 // Tailwind's 'md' breakpoint

export const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }

        handleResize() // Set initial value
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return { isMobile }
} 