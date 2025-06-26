import React, { useEffect, useRef, useState } from 'react';
import { Button, Select, Checkbox } from '@trussworks/react-uswds';
import { Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface DownloadMenuProps {
  fireId: string;
  featuresApiEndpoint: string;
  onClose: () => void;
}

const DownloadMenu: React.FC<DownloadMenuProps> = ({
  fireId,
  fireLatestObservationTimestamp,
  featuresApiEndpoint,
  onClose,
}) => {
  console.log(fireLatestObservationTimestamp);
  const [downloadFormat, setDownloadFormat] = useState<'geojson' | 'csv'>(
    'geojson'
  );
  const [downloadLayers, setDownloadLayers] = useState({
    perimeter: true,
    fireline: false,
    firepixels: false,
  });
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDownloadDisabled =
    downloading || !Object.values(downloadLayers).some(Boolean);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    const base = `${featuresApiEndpoint}/collections`;
    const layers = [
      downloadLayers.perimeter && 'public.eis_fire_lf_perimeter_nrt',
      downloadLayers.fireline && 'public.eis_fire_lf_fireline_nrt',
      downloadLayers.firepixels && 'public.eis_fire_lf_newfirepix_nrt',
    ].filter(Boolean) as string[];

    const nameMap: Record<string, string> = {
      'public.eis_fire_lf_perimeter_nrt': 'fire-perimeters',
      'public.eis_fire_lf_fireline_nrt': 'active-fire-fronts',
      'public.eis_fire_lf_newfirepix_nrt': 'fire-detections',
    };

    const zip = new JSZip();

    const safeTs = fireLatestObservationTimestamp.replace(/[:\/]/g, '_');

    for (const layer of layers) {
      const namePart = nameMap[layer];
      const url = `${base}/${layer}/items?filter=fireid%3D${fireId}&limit=500&sortby=-t&f=${downloadFormat}`;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        zip.file(
          `fire-${fireId}-${namePart}-${safeTs}.${downloadFormat}`,
          blob
        );
      } catch (e) {
        console.error(`Failed to download ${layer}`, e);
      }
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `fire-${fireId}-${safeTs}-data.zip`);
    } catch (e) {
      console.error('ZIP generation failed', e);
    }

    setDownloading(false);
    onClose();
  };

  return (
    <div
      className="download-menu position-absolute top-2 right-0"
      ref={menuRef}
    >
      <fieldset className="margin-bottom-2">
        <legend className="font-sans-3xs text-base-dark">Select layers</legend>

        <Checkbox
          id="dl-perimeter"
          name="dl-perimeter"
          label="Fire Perimeters"
          checked={downloadLayers.perimeter}
          onChange={() =>
            setDownloadLayers((prev) => ({
              ...prev,
              perimeter: !prev.perimeter,
            }))
          }
        />

        <Checkbox
          id="dl-fireline"
          name="dl-fireline"
          label="Active Fire Fronts"
          checked={downloadLayers.fireline}
          onChange={() =>
            setDownloadLayers((prev) => ({ ...prev, fireline: !prev.fireline }))
          }
        />

        <Checkbox
          id="dl-firepixels"
          name="dl-firepixels"
          label="Fire Detections"
          checked={downloadLayers.firepixels}
          onChange={() =>
            setDownloadLayers((prev) => ({
              ...prev,
              firepixels: !prev.firepixels,
            }))
          }
        />
      </fieldset>

      <label className="font-sans-3xs text-base-dark margin-bottom-05 display-block">
        Format
      </label>
      <Select
        id="download-format"
        name="download-format"
        className="width-full"
        value={downloadFormat}
        onChange={(e) => setDownloadFormat(e.target.value as 'geojson' | 'csv')}
      >
        <option value="geojson">GeoJSON</option>
        <option value="csv">CSV</option>
      </Select>

      <Button
        type="button"
        className="width-full margin-top-2"
        disabled={isDownloadDisabled}
        onClick={handleDownload}
        title="Download event layers"
      >
        {downloading ? (
          <span className="display-flex flex-align-center flex-justify-center">
            <Loader2 size={16} className="spin margin-right-1" /> Downloading…
          </span>
        ) : (
          'Download'
        )}
      </Button>
    </div>
  );
};

export default DownloadMenu;
