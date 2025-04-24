"use client";

import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Form, FormItem, FormLabel, FormControl, FormMessage, FormField } from "./ui/form";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import { Loader2 } from "lucide-react";
import axios from "axios";

const ContentType = {
  Url: "url",
  File: "file",
} as const;

type ContentType = (typeof ContentType)[keyof typeof ContentType];

const ContentTypeLabels = {
  [ContentType.Url]: "URL",
  [ContentType.File]: "Arquivo",
} satisfies Record<ContentType, string>;

export const GenerateCodeForm = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(ContentType.Url),
    url: z.string().url("URL inválida"),
  }),
  z.object({
    type: z.literal(ContentType.File),
    file: z.instanceof(File),
  }),
]);

export type GenerateCodeForm = z.infer<typeof GenerateCodeForm>;

export function QRCodeGenerator() {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const form = useForm<GenerateCodeForm>({
    defaultValues: { url: "" },
    resolver: zodResolver(GenerateCodeForm),
  });

  async function onSubmit(data: GenerateCodeForm) {
    if (data.type === ContentType.Url) {
      setUrl(data.url);
      return;
    }

    if (data.type === ContentType.File) {
      try {
        setUploading(true);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: data.file.name, fileType: data.file.type }),
        });

        const json = await response.json();

        if ("signedUrl" in json && "url" in json) {
          const response = await axios.put(json.signedUrl, data.file, {
            headers: { "Content-Type": data.file.type },
          });

          console.log("File uploaded successfully:", response);

          setUrl(json.url);
          toast.success("Arquivo enviado com sucesso");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Erro ao fazer upload do arquivo");
      } finally {
        setUploading(false);
      }
    }
  }

  function downloadQRCode(format: "png" | "jpg" | "svg") {
    if (format === "svg") {
      const svg = qrCodeRef.current?.querySelector("svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "qrcode.svg";
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      const canvas = qrCodeRef.current?.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL(`image/${format}`);
        link.download = `qrcode.${format}`;
        link.click();
      }
    }
  }

  const type = form.watch("type");

  return (
    <Card className="px-6">
      <div className="grid md:grid-cols-12 gap-4">
        {/* Left Column: Form */}
        <div className="col-span-8">
          <header className="mb-6">
            <h2 className="text-2xl">Conteúdo do QR Code</h2>
            <p>Selecione o tipo de conteúdo</p>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ContentType).map((option) => (
                          <SelectItem key={option} value={option}>
                            {ContentTypeLabels[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {type === ContentType.File && (
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arquivo</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          placeholder="Arquivo"
                          onBlur={field.onBlur}
                          multiple={false}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              field.onChange(file);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {type === ContentType.Url && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="mt-4">
                Gerar QR Code
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Column: QR Code Display */}
        <div className="col-span-4 flex flex-col items-center justify-center">
          {uploading ? (
            <Skeleton className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </Skeleton>
          ) : url.length > 0 ? (
            <div>
              <div ref={qrCodeRef}>
                <QRCodeCanvas value={url} size={256} />
              </div>

              <div className="flex space-x-3">
                <Button onClick={() => downloadQRCode("png")} className="mt-4" variant="outline">
                  PNG
                </Button>
                <Button onClick={() => downloadQRCode("jpg")} className="mt-4" variant="outline">
                  JPG
                </Button>
                {/* <Button onClick={() => downloadQRCode("svg")} className="mt-4" variant="outline">
                  SVG
                </Button> */}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
