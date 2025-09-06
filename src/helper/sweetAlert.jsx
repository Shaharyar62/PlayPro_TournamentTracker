import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import ReactDOMServer from "react-dom/server"; // For rendering JSX to HTML

export default class SweetAlert {
    static alert(
        message,
        icon = "success",
        title = "Success",
        showCancelButton = false
    ) {
        Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonText: "Ok",
            confirmButtonColor: "red",
            showCancelButton: showCancelButton,
            cancelButtonText: "Close",
            cancelButtonColor: "#d33",
            allowOutsideClick: true,
            allowEscapeKey: true,
            customClass: {
                popup: "z-[99999]",
            },
        });
    }

    static confirmation(
        message,
        title = "Are you sure?",
        showCancelButton = true,
        confirmButtonColor = "#3085d6",
        cancelButtonColor = "#d33",
        confirmButtonText = "Yes",
        cancelButtonText = "No",
        icon = "warning"
    ) {
        return new Promise((res) => {
            Swal.fire({
                title: title,
                text: message,
                icon: icon,
                confirmButtonText,
                cancelButtonText,
                showCancelButton,
                confirmButtonColor,
                cancelButtonColor,
            }).then((result) => {
                res(result.isConfirmed);
            });
        });
    }

    static poorconnectivety(
        message = "Please check your internet connection.",
        title = "No Internet",
        showCancelButton = false
    ) {
        Swal.fire({
            html: `
            <div style="text-align: center; font-size: 18px; padding: 10px;">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="70" height="70">
                  <defs><style>.cls-1 {fill: #de002b;}.cls-1, .cls-2 {fill-rule: evenodd;stroke-width: 0px;}.cls-2 {fill: #2a57b5;}</style></defs>
                  <path class="cls-1" d="m12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM0,12C0,5.37,5.37,0,12,0s12,5.37,12,12-5.37,12-12,12S0,18.63,0,12Z"/>
                  <g>
                    <path class="cls-2" d="m10,17c0-1.1.9-2,2-2s2,.9,2,2-.9,2-2,2-2-.9-2-2Z"/>
                    <path class="cls-2" d="m12,14c-.77,0-1.57.49-2.13,1.49-.27.48-.88.65-1.36.38-.48-.27-.65-.88-.38-1.36.81-1.43,2.18-2.51,3.87-2.51s3.07,1.08,3.87,2.51c.27.48.1,1.09-.38,1.36-.48.27-1.09.1-1.36-.38-.56-1-1.36-1.49-2.13-1.49Z"/>
                    <path class="cls-2" d="m12,10.5c-1.64,0-3.16.94-4.15,2.53-.29.47-.91.61-1.38.32s-.61-.91-.32-1.38c1.29-2.05,3.39-3.47,5.85-3.47s4.56,1.42,5.85,3.47c.29.47.15,1.09-.32,1.38-.47.29-1.09.15-1.38-.32-.99-1.59-2.52-2.53-4.15-2.53Z"/>
                    <path class="cls-2" d="m12,7c-2.48,0-4.72,1.36-6.16,3.55-.3.46-.92.59-1.38.29s-.59-.92-.29-1.38c1.75-2.67,4.59-4.45,7.84-4.45s6.08,1.78,7.84,4.45c.3.46.18,1.08-.29,1.38-.46.3-1.08.18-1.38-.29-1.44-2.19-3.69-3.55-6.16-3.55Z"/>
                  </g>
                  <path class="cls-1" d="m3.29,19.29L19.29,3.29l1.41,1.41L4.71,20.71s-1.41-1.41-1.41-1.41Z"/>
                </svg>
                </div>
                <h1 style="font-size: 1.875em;font-weight: 600; margin-bottom: 10px; color: #333; text-align: center;">${title}</h1>
                <span style="font-size: 16px; color: #555;">${message}</span>
            </div>
        `,
            confirmButtonText: "Ok",
            confirmButtonColor: "red",
            showCancelButton: showCancelButton,
            allowOutsideClick: true,
            allowEscapeKey: true,
            customClass: {
                popup: "z-[99999]",
            },
        });
    }


    static poorconnectivety1(
        message = "Please check your internet connection.",
        title = "No Internet",
        icon = "heroicons:wifi-off", // Iconify icon
        showCancelButton = false
    ) {
        // Use ReactDOMServer to render JSX into HTML
        const iconHtml = ReactDOMServer.renderToString(
            <Icon icon={icon} style={{ fontSize: "40px", color: "red" }} />
        );

        Swal.fire({
            title: title,
            html: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 18px;">
                    <span>${iconHtml}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 18h2v2h-2zm0-8h2v6h-2z"/><path fill="currentColor" d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21l5-5.01V8h5.92C19.97 5.51 16.16 4 12 4"/></svg>
                    <span>${message}</span>
                </div>
            `,
            confirmButtonText: "Ok",
            confirmButtonColor: "red",
            showCancelButton: showCancelButton,
            allowOutsideClick: true,
            allowEscapeKey: true,
            customClass: {
                popup: "z-[99999]",
            },
        });
    }
}
