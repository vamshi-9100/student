"use client";

import React, { useMemo } from "react";

import type { ReactElement } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { getTextSize } from "@/lib/text-sizes";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Wifi,
  HardDrive,
  CheckCircle,
  Loader2,
  Navigation,
} from "lucide-react";
import { gatewayService } from "@/services/gateway-service";
import { useAuth } from "@/contexts/auth-context";

interface GatewayFormData {
  // Basic Information
  gatewayName: string;
  gatewayType: string;
  model: string;
  region: string;
  serialNumber: string;
  companyId: number | null;
  clientId: number | null;

  // Location
  locationName: string;
  latitude: string;
  longitude: string;

  // Technical Specifications
  firmwareVersion: string;
  hardwareVersion: string;
  ipAddress: string;
  macAddress: string;

  // System Resources (all optional)
  cpuLoad: string;
  ramCapacity: string;
  ramAvailable: string;
  emmcCapacity: string;
  emmcAvailable: string;
}

interface AddGatewayFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GATEWAY_TYPES = ["LoRaWAN", "WiFi", "Cellular", "Ethernet", "Modbus"];
const REGIONS = ["US915", "EU868", "AS923", "AU915", "KR920", "IN865"];

export function AddGatewayForm({
  open,
  onOpenChange,
}: AddGatewayFormProps): ReactElement {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  const [formData, setFormData] = useState<GatewayFormData>({
    gatewayName: "",
    gatewayType: "",
    model: "",
    region: "",
    serialNumber: "",
    locationName: "",
    latitude: "",
    longitude: "",
    firmwareVersion: "",
    hardwareVersion: "",
    ipAddress: "",
    macAddress: "",
    cpuLoad: "",
    ramCapacity: "",
    ramAvailable: "",
    emmcCapacity: "",
    emmcAvailable: "",
    companyId: null,
    clientId: null,
  });

  const { companies, clients } = useAuth();
  const companyOptions = useMemo(() => companies ?? [], [companies]);
  const clientOptions = useMemo(() => clients ?? [], [clients]);

  const updateFormData = (
    field: keyof GatewayFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.gatewayName &&
          formData.gatewayType &&
          formData.region &&
          formData.serialNumber
        );
      case 2:
        return !!(
          formData.locationName &&
          formData.latitude &&
          formData.longitude
        );
      case 3:
        return !!(
          formData.firmwareVersion &&
          formData.hardwareVersion &&
          formData.ipAddress &&
          formData.macAddress
        );
      case 4:
        return true; // All fields in step 4 are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast({
        title: t("requiredFieldsMissing"),
        description: t("fillRequiredFields"),
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: t("geolocationNotSupported"),
        description: t("geolocationError"),
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateFormData("latitude", latitude.toFixed(6));
        updateFormData("longitude", longitude.toFixed(6));
        toast({
          title: t("locationObtained"),
          description: t("locationObtainedDescription"),
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: t("locationError"),
          description: t("unableToGetLocation"),
          variant: "destructive",
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: t("requiredFieldsMissing"),
        description: t("fillRequiredFields"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      //await new Promise((resolve) => setTimeout(resolve, 2000))
      await gatewayService.createGateway(formData);

      toast({
        title: t("gatewayAddedSuccess"),
        description: `${formData.gatewayName} ${t("gatewayAddedDescription")}`,
      });

      // Reset form and close dialog
      setFormData({
        gatewayName: "",
        gatewayType: "",
        model: "",
        region: "",
        serialNumber: "",
        locationName: "",
        latitude: "",
        longitude: "",
        firmwareVersion: "",
        hardwareVersion: "",
        ipAddress: "",
        macAddress: "",
        cpuLoad: "",
        ramCapacity: "",
        ramAvailable: "",
        emmcCapacity: "",
        emmcAvailable: "",
        companyId: null,
        clientId: null,
      });
      setCurrentStep(1);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("error"),
        description: t("failedToAddGateway"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: t("basicInformation"),
      icon: Wifi,
      description: t("gatewayDetailsConfig"),
    },
    {
      number: 2,
      title: t("location"),
      icon: MapPin,
      description: t("physicalLocationInfo"),
    },
    {
      number: 3,
      title: t("technicalSpecs"),
      icon: HardDrive,
      description: t("technicalSpecifications"),
    },
    {
      number: 4,
      title: t("systemResources"),
      icon: CheckCircle,
      description: t("systemResourceInfo"),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="gatewayName"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("gatewayName")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="gatewayName"
                  value={formData.gatewayName}
                  onChange={(e) =>
                    updateFormData("gatewayName", e.target.value)
                  }
                  placeholder={t("enterGatewayName")}
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="gatewayType"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("gatewayType")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gatewayType}
                  onValueChange={(value) =>
                    updateFormData("gatewayType", value)
                  }
                >
                  <SelectTrigger className={getTextSize("formInput")}>
                    <SelectValue placeholder={t("selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {GATEWAY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="model"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("model")}{" "}
                  <span className="text-gray-500 text-sm">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => updateFormData("model", e.target.value)}
                  placeholder={t("enterModel")}
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="region"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("region")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => updateFormData("region", value)}
                >
                  <SelectTrigger className={getTextSize("formInput")}>
                    <SelectValue placeholder={t("selectRegion")} />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* company and client dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Dropdown */}
              <div className="space-y-2">
                <Label
                  htmlFor="company"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("company")} <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={
                    formData.companyId !== null
                      ? String(formData.companyId)
                      : ""
                  }
                  onValueChange={(value) =>
                    updateFormData("companyId", Number(value))
                  }
                >
                  <SelectTrigger className={getTextSize("formInput")}>
                    <SelectValue placeholder={t("selectedCompany")} />
                  </SelectTrigger>

                  <SelectContent>
                    {companyOptions.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Dropdown */}
              <div className="space-y-2">
                <Label
                  htmlFor="client"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("client")} <span className="text-red-500">*</span>
                </Label>

                <Select
                  value={
                    formData.clientId !== null ? String(formData.clientId) : ""
                  }
                  onValueChange={(value) =>
                    updateFormData("clientId", Number(value))
                  }
                >
                  <SelectTrigger className={getTextSize("formInput")}>
                    <SelectValue placeholder={t("selectedClient")} />
                  </SelectTrigger>

                  <SelectContent>
                    {clientOptions.map((client) => (
                      <SelectItem
                        key={client.clientId}
                        value={String(client.clientId)}
                      >
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="serialNumber"
                className={`${getTextSize("formLabel")} ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("serialNumber")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => updateFormData("serialNumber", e.target.value)}
                placeholder={t("enterSerialNumber")}
                className={`${getTextSize("formInput")} ${
                  isRTL ? "text-right" : "text-left"
                }`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
            <div className="space-y-2">
              <Label
                htmlFor="locationName"
                className={`${getTextSize("formLabel")} ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("locationName")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="locationName"
                value={formData.locationName}
                onChange={(e) => updateFormData("locationName", e.target.value)}
                placeholder={t("enterLocationName")}
                className={`${getTextSize("formInput")} ${
                  isRTL ? "text-right" : "text-left"
                }`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="latitude"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("latitude")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => updateFormData("latitude", e.target.value)}
                  placeholder="0.000000"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="longitude"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("longitude")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => updateFormData("longitude", e.target.value)}
                  placeholder="0.000000"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className={`w-full ${getTextSize("button")} ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              {isGettingLocation ? (
                <>
                  <Loader2
                    className={`w-4 h-4 ${
                      isRTL ? "ml-2" : "mr-2"
                    } animate-spin`}
                  />
                  {t("gettingLocation")}
                </>
              ) : (
                <>
                  <Navigation
                    className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                  />
                  {t("useCurrentLocation")}
                </>
              )}
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firmwareVersion"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("firmwareVersion")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firmwareVersion"
                  value={formData.firmwareVersion}
                  onChange={(e) =>
                    updateFormData("firmwareVersion", e.target.value)
                  }
                  placeholder="v1.0.0"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="hardwareVersion"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("hardwareVersion")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hardwareVersion"
                  value={formData.hardwareVersion}
                  onChange={(e) =>
                    updateFormData("hardwareVersion", e.target.value)
                  }
                  placeholder="v2.1"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="ipAddress"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("ipAddress")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ipAddress"
                  value={formData.ipAddress}
                  onChange={(e) => updateFormData("ipAddress", e.target.value)}
                  placeholder="192.168.1.100"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="macAddress"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("macAddress")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="macAddress"
                  value={formData.macAddress}
                  onChange={(e) => updateFormData("macAddress", e.target.value)}
                  placeholder="00:1B:44:11:3A:B7"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
            <div className="text-center mb-4">
              <p
                className={`text-gray-600 dark:text-gray-400 ${getTextSize(
                  "body"
                )}`}
              >
                {t("allFieldsOptional")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="cpuLoad"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("cpuLoad")}{" "}
                  <span className="text-gray-500 text-sm">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="cpuLoad"
                  value={formData.cpuLoad}
                  onChange={(e) => updateFormData("cpuLoad", e.target.value)}
                  placeholder="25%"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ramCapacity"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("ramCapacity")}{" "}
                  <span className="text-gray-500 text-sm">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="ramCapacity"
                  value={formData.ramCapacity}
                  onChange={(e) =>
                    updateFormData("ramCapacity", e.target.value)
                  }
                  placeholder="512MB"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="ramAvailable"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("ramAvailable")}{" "}
                  <span className="text-gray-500 text-sm">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="ramAvailable"
                  value={formData.ramAvailable}
                  onChange={(e) =>
                    updateFormData("ramAvailable", e.target.value)
                  }
                  placeholder="384MB"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emmcCapacity"
                  className={`${getTextSize("formLabel")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("emmcCapacity")}{" "}
                  <span className="text-gray-500 text-sm">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="emmcCapacity"
                  value={formData.emmcCapacity}
                  onChange={(e) =>
                    updateFormData("emmcCapacity", e.target.value)
                  }
                  placeholder="8GB"
                  className={`${getTextSize("formInput")} ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="emmcAvailable"
                className={`${getTextSize("formLabel")} ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("emmcAvailable")}{" "}
                <span className="text-gray-500 text-sm">({t("optional")})</span>
              </Label>
              <Input
                id="emmcAvailable"
                value={formData.emmcAvailable}
                onChange={(e) =>
                  updateFormData("emmcAvailable", e.target.value)
                }
                placeholder="6.2GB"
                className={`${getTextSize("formInput")} ${
                  isRTL ? "text-right" : "text-left"
                }`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle
            className={`${getTextSize("h3")} ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {t("addNewGateway")}
          </DialogTitle>
          <DialogDescription
            className={`${getTextSize("body")} ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {t("fillGatewayInformation")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div
            className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex flex-wrap gap-2 sm:gap-4 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex items-center ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      currentStep === step.number
                        ? "bg-blue-600 text-white"
                        : currentStep > step.number
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className={`${isRTL ? "mr-2" : "ml-2"} hidden sm:block`}>
                    <p
                      className={`font-medium ${getTextSize("bodySmall")} ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {t("step")} {step.number}: {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isRTL ? "mr-2" : "ml-2"
                      } text-gray-400 hidden sm:block ${
                        isRTL ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Step Title */}
          <div className="sm:hidden">
            <h3
              className={`font-semibold ${getTextSize("h4")} ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {t("step")} {currentStep}: {steps[currentStep - 1].title}
            </h3>
            <p
              className={`text-gray-600 dark:text-gray-400 ${getTextSize(
                "bodySmall"
              )} ${isRTL ? "text-right" : "text-left"}`}
            >
              {steps[currentStep - 1].description}
            </p>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader className="pb-4">
              <div
                className={`flex items-center gap-3 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {React.createElement(steps[currentStep - 1].icon, {
                    className: "w-5 h-5 text-blue-600 dark:text-blue-400",
                  })}
                </div>
                <div
                  className={`hidden sm:block ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  <CardTitle className={getTextSize("h4")}>
                    {t("step")} {currentStep}: {steps[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription className={getTextSize("bodySmall")}>
                    {steps[currentStep - 1].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div
            className={`flex flex-col sm:flex-row justify-between gap-3 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`order-2 sm:order-1 ${getTextSize("button")} ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              {isRTL ? (
                <ChevronRight className="w-4 h-4 ml-2" />
              ) : (
                <ChevronLeft className="w-4 h-4 mr-2" />
              )}
              {t("previous")}
            </Button>

            <div
              className={`flex gap-2 order-1 sm:order-2 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={getTextSize("button")}
              >
                {t("cancel")}
              </Button>

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className={`${getTextSize("button")} ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  {t("next")}
                  {isRTL ? (
                    <ChevronLeft className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`${getTextSize("button")} ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className={`w-4 h-4 ${
                          isRTL ? "ml-2" : "mr-2"
                        } animate-spin`}
                      />
                      {t("adding")}
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                      />
                      {t("addGateway")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
