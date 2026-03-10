"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ConsultationWidgetContextType {
	isConsultationOpen: boolean;
	setIsConsultationOpen: (isOpen: boolean) => void;
}

const ConsultationWidgetContext = createContext<
	ConsultationWidgetContextType | undefined
>(undefined);

export function ConsultationWidgetProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [isConsultationOpen, setIsConsultationOpen] = useState(false);

	return (
		<ConsultationWidgetContext.Provider
			value={{ isConsultationOpen, setIsConsultationOpen }}
		>
			{children}
		</ConsultationWidgetContext.Provider>
	);
}

export function useConsultationWidget() {
	const context = useContext(ConsultationWidgetContext);
	if (context === undefined) {
		throw new Error(
			"useConsultationWidget must be used within a ConsultationWidgetProvider"
		);
	}
	return context;
}
