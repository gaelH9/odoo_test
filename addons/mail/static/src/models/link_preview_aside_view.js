/** @odoo-module **/

import { clear, one, Model } from "@mail/model";

Model({
    name: "LinkPreviewAsideView",
    template: "mail.LinkPreviewAsideView",
    identifyingMode: "xor",
    recordMethods: {
        /**
         * Handles the click on delete link preview and open the confirm dialog.
         */
        onClick() {
            this.update({ linkPreviewDeleteConfirmDialog: {} });
        },
    },
    fields: {
        linkPreview: one("LinkPreview", {
            compute() {
                if (this.linkPreviewCardView) {
                    return this.linkPreviewCardView.linkPreview;
                }
                if (this.linkPreviewImageView) {
                    return this.linkPreviewImageView.linkPreview;
                }
                if (this.linkPreviewVideoView) {
                    return this.linkPreviewVideoView.linkPreview;
                }
                return clear();
            },
            required: true,
        }),
        linkPreviewCardView: one("LinkPreviewCardView", {
            identifying: true,
            inverse: "linkPreviewAsideView",
        }),
        linkPreviewDeleteConfirmDialog: one("Dialog", {
            inverse: "linkPreviewAsideViewOwnerAsLinkPreviewDeleteConfirm",
            isCausal: true,
        }),
        linkPreviewImageView: one("LinkPreviewImageView", {
            identifying: true,
            inverse: "linkPreviewAsideView",
        }),
        linkPreviewVideoView: one("LinkPreviewVideoView", {
            identifying: true,
            inverse: "linkPreviewAsideView",
        }),
    },
});
