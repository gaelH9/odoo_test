/** @odoo-module **/

import ActivityRecord from "@mail/js/views/activity/activity_record";
import { ActivityCellViewContainer } from "@mail/backend_components/activity_cell_view/activity_cell_view_container";

import AbstractRendererOwl from "web.AbstractRendererOwl";
import core from "web.core";
import KanbanColumnProgressBar from "web.KanbanColumnProgressBar";
import { ComponentAdapter } from "web.OwlCompatibility";
import QWeb from "web.QWeb";
import session from "web.session";
import utils from "web.utils";

import { useState } from "@odoo/owl";
const _t = core._t;

/**
 * Owl Component Adapter for ActivityRecord which is KanbanRecord (Odoo Widget)
 * TODO: Remove this adapter when ActivityRecord is a Component
 */
class ActivityRecordAdapter extends ComponentAdapter {
    renderWidget() {
        _.invoke(_.pluck(this.widget.subWidgets, "$el"), "detach");
        this.widget._render();
    }

    updateWidget(nextProps) {
        const state = nextProps.widgetArgs[0];
        this.widget._setState(state);
    }
}

/**
 * Owl Component Adapter for KanbanColumnProgressBar (Odoo Widget)
 * TODO: Remove this adapter when KanbanColumnProgressBar is a Component
 */
class KanbanColumnProgressBarAdapter extends ComponentAdapter {
    renderWidget() {
        this.widget._render();
    }

    updateWidget(nextProps) {
        const options = nextProps.widgetArgs[0];
        const columnState = nextProps.widgetArgs[1];

        const columnId = options.columnID;
        const nextActiveFilter = options.progressBarStates[columnId].activeFilter;
        this.widget.activeFilter = nextActiveFilter ? this.widget.activeFilter : false;
        this.widget.columnState = columnState;
        this.widget.computeCounters();
    }

    _trigger_up(ev) {
        // KanbanColumnProgressBar triggers 3 events before being mounted
        // but we don't need to listen to them in our case.
        if (this.el) {
            if (ev.name === "set_progress_bar_state") {
                this.props.onSetProgressBarState(
                    new CustomEvent("set-progress-bar-state", {
                        bubbles: true,
                        cancelable: true,
                        detail: ev.data,
                    })
                );
            }
            super._trigger_up(ev);
        }
    }
}

class ActivityRenderer extends AbstractRendererOwl {
    setup() {
        super.setup(...arguments);
        this.qweb = new QWeb(this.env.isDebug(), { _s: session.origin });
        this.qweb.add_template(utils.json_node_to_xml(this.props.templates));
        this.activeFilter = useState({
            state: null,
            activityTypeId: null,
            resIds: [],
        });
        this.widgetComponents = {
            ActivityRecord,
            KanbanColumnProgressBar,
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Gets all activity resIds in the view.
     *
     * @returns filtered resIds first then the rest.
     */
    get activityResIds() {
        const copiedActivityResIds = Array.from(this.props.activity_res_ids);
        return copiedActivityResIds.sort((a, b) => (this.activeFilter.resIds.includes(a) ? -1 : 0));
    }

    /**
     * Gets all existing activity type ids.
     */
    get activityTypeIds() {
        const activities = Object.values(this.props.grouped_activities);
        const activityIds = activities.flatMap(Object.keys);
        const uniqueIds = Array.from(new Set(activityIds));
        return uniqueIds.map(Number);
    }

    getProgressBarOptions(typeId) {
        return {
            columnID: typeId,
            progressBarStates: {
                [typeId]: {
                    activeFilter: this.activeFilter.activityTypeId === typeId,
                },
            },
        };
    }

    getProgressBarColumnState(typeId) {
        const counts = { planned: 0, today: 0, overdue: 0 };
        for (const activities of Object.values(this.props.grouped_activities)) {
            if (typeId in activities) {
                counts[activities[typeId].state] += 1;
            }
        }
        return {
            count: Object.values(counts).reduce((x, y) => x + y),
            fields: {
                activity_state: {
                    type: "selection",
                    selection: [
                        ["planned", _t("Planned")],
                        ["today", _t("Today")],
                        ["overdue", _t("Overdue")],
                    ],
                },
            },
            progressBarValues: {
                field: "activity_state",
                colors: { planned: "success", today: "warning", overdue: "danger" },
                counts: counts,
            },
        };
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------
    /**
     * @private
     * @param {MouseEvent} ev
     */
    _onEmptyCellClicked(ev) {
        this.trigger("empty_cell_clicked", {
            resId: parseInt(ev.currentTarget.dataset.resId, 10),
            activityTypeId: parseInt(ev.currentTarget.dataset.activityTypeId, 10),
        });
    }
    /**
     * @private
     * @param {MouseEvent} ev
     */
    _onSendMailTemplateClicked(ev) {
        this.trigger("send_mail_template", {
            activityTypeID: parseInt(ev.currentTarget.dataset.activityTypeId, 10),
            templateID: parseInt(ev.currentTarget.dataset.templateId, 10),
        });
    }
    /**
     * @private
     * @param {CustomEvent} ev
     */
    _onSetProgressBarState(ev) {
        if (ev.detail.values.activeFilter) {
            this.activeFilter.state = ev.detail.values.activeFilter;
            this.activeFilter.activityTypeId = ev.detail.columnID;
            this.activeFilter.resIds = Object.entries(this.props.grouped_activities)
                .filter(
                    ([, resIds]) =>
                        ev.detail.columnID in resIds &&
                        resIds[ev.detail.columnID].state === ev.detail.values.activeFilter.value
                )
                .map(([key]) => parseInt(key));
        } else {
            this.activeFilter.state = null;
            this.activeFilter.activityTypeId = null;
            if (this.activeFilter.resIds.length > 0) {
                // writing a new array is a state mutation which triggers a rerender
                // only replace resIds with empty array if it's not already empty
                this.activeFilter.resIds = [];
            }
        }
    }
}

ActivityRenderer.components = {
    ActivityCellViewContainer,
    ActivityRecordAdapter,
    KanbanColumnProgressBarAdapter,
};
ActivityRenderer.template = "mail.ActivityRenderer";

export default ActivityRenderer;
