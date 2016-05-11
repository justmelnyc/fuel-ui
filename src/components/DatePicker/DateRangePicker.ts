import {Component, Directive, ChangeDetectionStrategy, ChangeDetectorRef, Renderer} from '@angular/core';
import {AfterContentInit, AfterContentChecked, OnInit} from "@angular/core";
import {EventEmitter, ElementRef, ViewChild, ViewChildren,ContentChild,QueryList} from '@angular/core';
import {Input, Output, HostListener, HostBinding} from "@angular/core";
import {CORE_DIRECTIVES, FORM_DIRECTIVES} from '@angular/common';
import {DateRange} from "../../utilities/DateUtils";
import {MobileDetection} from "../../utilities/DetectionUtils";
import {DatePicker} from "./DatePicker";
import {DatePickerCalendar} from "./DatePickerCalendar";
import {DatePickerField} from "./DatePickerField";
import {InfiniteScroller, INFINITE_SCROLLER_PROVIDERS} from "../InfiniteScroller/InfiniteScroller";

@Directive({
    selector: "[startDateField], .start-date-field",
})
export class StartDateField extends DatePickerField {
    constructor(public element: ElementRef) {
        super();
    }
}

@Directive({
    selector: "[endDateField], .start-date-field",
})
export class EndDateField extends DatePickerField {
    constructor(public element: ElementRef) {
        super();
    }
}

@Component({
    selector: "date-range-picker",
    templateUrl: 'components/DatePicker/DateRangePicker.html',
    directives: [DatePickerCalendar, INFINITE_SCROLLER_PROVIDERS, CORE_DIRECTIVES, FORM_DIRECTIVES],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangePicker extends DatePicker implements AfterContentInit {    
    @Output() valueChange = new EventEmitter();
    @Input()
    set value(value: any) {
        this._selectedDate = this.handleRangeInput(value).start;
    }

    @Input()
    set minDate(value: Date | string) {
        this._minDate = DatePicker.handleDateInput(value);
    }
    get minDate(): Date | string { return this._minDate; };

    @Input()
    set maxDate(value: Date | string) {
        this._maxDate = DatePicker.handleDateInput(value);
    }
    get maxDate(): Date | string { return this._maxDate; }

    @Input() dateFilter: (d: Date) => boolean;

    @ViewChild(InfiniteScroller)
    calendarScroller: InfiniteScroller;
    
    @ContentChild(StartDateField)
    startDateField: StartDateField;
    @ContentChild(EndDateField)
    endDateField: EndDateField;

    private _dateTarget: boolean = false;
    calendarHeight: string = MobileDetection.isAny() || window.innerWidth <= 480 || window.outerWidth <= 480 ? "auto" : "300px";

    get selectedDate(): Date { return this._selectedDate };
    set selectedDate(value: Date) {
        this.selectDate(value);
    }

    get inputStartDate(): string {
        return this.startDateField != null ? this.startDateField.value : "";
    }
    
    get inputEndDate(): string {
        return this.endDateField != null ? this.endDateField.value : "";
    }

    private _startDate: Date;
    private _endDate: Date;

    @Output() startDateChange = new EventEmitter();
    @Input()
    set startDate(value: any) {
        this._startDate = DatePicker.handleDateInput(value);
        if(this.startDateField != null)
            this.startDateField._value = this._startDate.toLocaleDateString();
    }
    get startDate(): any { return this._startDate; }

    @Output() endDateChange = new EventEmitter();
    @Input()
    set endDate(value: any) {
        this._endDate = DatePicker.handleDateInput(value);
        if(this.endDateField != null)
            this.endDateField._value = this._endDate.toLocaleDateString();
    }
    get endDate(): any { return this._endDate; }

    constructor(changeDetector: ChangeDetectorRef, renderer: Renderer) {
        super(changeDetector, renderer);
    }

    ngAfterContentInit(): void {
        if(typeof this.startDateField === "undefined")
            throw "Fuel-UI Error: DateRangePicker missing startDate field";
        
        if(this.startDateField.value.length > 0) {
            let startDateValue = DatePicker.handleDateInput(this.startDateField.value);
            if(!isNaN(startDateValue.getTime()))
                this.selectDate(startDateValue, false);
        }
        
        this.startDateField.select
            .subscribe((event: MouseEvent) => {
                this.toggleCalendar(event);
                this.focusStartDate();
            });
            
        this.startDateField.dateChange
            .subscribe((date: Date) => {
                this.startDate = date;
            });
        
        if(typeof this.endDateField === "undefined")
            throw "Fuel-UI Error: DateRangePicker missing endDate field";
        
        if(this.endDateField.value.length > 0) {
            let endDateValue = DatePicker.handleDateInput(this.endDateField.value);
            if(!isNaN(endDateValue.getTime()))
                this.selectDate(endDateValue, true); 
        }
        
        this.endDateField.select
            .subscribe((event: MouseEvent) => {
                this.toggleCalendar(event);
                this.focusEndDate();
            });
            
        this.endDateField.dateChange
            .subscribe((date: Date) => {
                this.endDate = date;
            });
    }

    selectDate(value: Date, target?: boolean): void {
        this._selectedDate = value;

        let dateTarget = (typeof target !== "undefined" && target != null) ? target : this._dateTarget;

        if ((this._startDate != undefined && this._endDate != undefined) && 
            (this._startDate.getFullYear() > 1970 && this._endDate.getFullYear() > 1970) &&
            ((dateTarget && value < this._startDate) || (!dateTarget && value > this._endDate)))
            dateTarget = !dateTarget;

        if (!dateTarget) {
            this.startDate = value;
            if (this.startDateChange != null)
                this.startDateChange.next(this._startDate);
        }
        else {
            this.endDate = value;
            this.hideCalendar();
            if (this.endDateChange != null)
                this.endDateChange.next(this._endDate);
        }

        this._dateTarget = !dateTarget;

        if (this.startDate != null && this.endDate != null) {
            let startDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
            let endDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());

            this.valueChange.next(new DateRange(startDate, endDate));
        }
        this.changeDetector.markForCheck();
    }

    handleRangeInput(value: any): DateRange {
        if (!(value instanceof DateRange))
            throw "DateRangePicker error: input is not of type DateRange";

        var range = <DateRange>value;

        this.startDate = range.start;
        this.endDate = range.end;
        return range;
    }

    focusStartDate(): void {
        this._dateTarget = false;
    }

    focusEndDate(): void {
        this._dateTarget = true;
    }

    checkStartDateTarget(): boolean {
        return !this._dateTarget;
    }

    checkEndDateTarget(): boolean {
        return this._dateTarget;
    }
}