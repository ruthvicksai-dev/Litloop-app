import InputField from "@/components/ui/InputField";
import React from "react";

type BookMetadataFieldsProps = {
    pageCount: string;
    publishedYear: string;
    publisher: string;
    onChangePageCount: (value: string) => void;
    onChangePublishedYear: (value: string) => void;
    onChangePublisher: (value: string) => void;
};

export default function BookMetadataFields({
    pageCount,
    publishedYear,
    publisher,
    onChangePageCount,
    onChangePublishedYear,
    onChangePublisher,
}: BookMetadataFieldsProps) {
    return (
        <>
            <InputField
                label="Page Count"
                placeholder="e.g. 320"
                value={pageCount}
                onChangeText={onChangePageCount}
                keyboardType="number-pad"
            />
            <InputField
                label="Published Year"
                placeholder="e.g. 2020"
                value={publishedYear}
                onChangeText={onChangePublishedYear}
                keyboardType="number-pad"
                maxLength={4}
            />
            <InputField
                label="Publisher"
                placeholder="Publisher name"
                value={publisher}
                onChangeText={onChangePublisher}
            />
        </>
    );
}
