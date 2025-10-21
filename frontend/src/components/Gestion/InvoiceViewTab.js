import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { buildInvoicePayload } from '../../utils/documentGenerator';
import api from '../../utils/api';

const InvoiceViewTab = ({ reservation }) => {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hydratedReservation, setHydratedReservation] = useState(null);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState(null);

  const hasInvoiceNumber = Boolean(
    reservation?._original?.invoice_number ||
      reservation?._original?.invoiceNumber ||
      reservation?.invoice_number ||
      reservation?.invoiceNumber
  );

  const baseReservation = useMemo(
    () => reservation?._original || reservation || null,
    [reservation]
  );

  useEffect(() => {
    setHydrationError(null);
    setHydratedReservation(baseReservation || null);

    if (!baseReservation?.id) {
      return;
    }

    const hasBusinessSettings = Boolean(
      baseReservation.business_settings ||
      baseReservation.businessSettings ||
      baseReservation?.meta?.business_settings
    );

    if (hasBusinessSettings) {
      return;
    }

    let didCancel = false;
    const controller = new AbortController();

    const hydrateReservation = async () => {
      try {
        setHydrating(true);
        const response = await api.get(`/reservations/${baseReservation.id}`, {
          signal: controller.signal,
        });

        const fullReservation = response.data;

        const currentAdvisorDocument =
          fullReservation.advisor?.id_card ||
          fullReservation.advisor?.idCard ||
          fullReservation.advisor?.document_number ||
          fullReservation.advisor?.documentNumber ||
          fullReservation.advisor?.cedula ||
          fullReservation.advisor?.dni ||
          fullReservation.advisor?.cc ||
          null;

        // Si el advisor no tiene documento asociado, hacer fetch del usuario completo
        if (fullReservation.advisor_id && !currentAdvisorDocument) {
          try {
            const advisorResponse = await api.get(`/users/${fullReservation.advisor_id}`, {
              signal: controller.signal,
            });

            const advisorData = advisorResponse.data;
            const advisorDocument =
              advisorData.idCard ||
              advisorData.id_card ||
              advisorData.documentNumber ||
              advisorData.document_number ||
              advisorData.cedula ||
              advisorData.dni ||
              advisorData.cc ||
              null;

            fullReservation.advisor = {
              ...advisorData,
              idCard: advisorData.idCard ?? advisorDocument ?? null,
              id_card: advisorData.id_card ?? advisorDocument ?? null,
              document_number: advisorData.document_number ?? advisorDocument ?? null,
              documentNumber: advisorData.documentNumber ?? advisorDocument ?? null,
            };
          } catch (advisorError) {
            console.warn('Could not fetch full advisor data:', advisorError);
          }
        }

        if (!didCancel) {
          setHydratedReservation(fullReservation);
        }
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return;
        }
        console.error('Error fetching full reservation for invoice:', fetchError);
        if (!didCancel) {
          const errorMessage = fetchError.response?.data?.message || fetchError.message || 'No se pudo obtener la información completa de la reserva.';
          setHydrationError(errorMessage);
        }
      } finally {
        if (!didCancel) {
          setHydrating(false);
        }
      }
    };

    hydrateReservation();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [baseReservation]);

  const reservationForInvoice = hydratedReservation || baseReservation;

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe) {
      setError('No se pudo inicializar la vista de factura.');
      setLoading(false);
      return;
    }

    let isCancelled = false;
    let retryTimeout = null;

    const renderInvoiceInsideFrame = (attempt = 0) => {
      if (isCancelled) {
        return;
      }

      try {
        const iframeWindow = iframe.contentWindow;

        if (iframeWindow && typeof iframeWindow.renderInvoice === 'function') {
          if (!reservationForInvoice) {
            setError('No hay datos disponibles de la reserva para generar la factura.');
            setLoading(false);
            return;
          }
          const sourceReservation = reservationForInvoice;
          const invoicePayload = buildInvoicePayload(sourceReservation);
          iframeWindow.renderInvoice(invoicePayload);
          setLoading(false);
          return;
        }

        if (attempt < 8) {
          retryTimeout = window.setTimeout(() => renderInvoiceInsideFrame(attempt + 1), 100);
        } else {
          setError('La plantilla de factura no esta disponible.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error rendering inline invoice:', err);
        setError(err.message || 'No se pudo generar la factura.');
        setLoading(false);
      }
    };

    const handleLoad = () => {
      renderInvoiceInsideFrame();
    };

    setLoading(true);
    setError(null);

    const iframeWindow = iframe.contentWindow;
    if (iframeWindow && typeof iframeWindow.renderInvoice === 'function') {
      renderInvoiceInsideFrame();
    } else {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      isCancelled = true;
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
      iframe.removeEventListener('load', handleLoad);
    };
  }, [reservation, reservationForInvoice]);

  const combinedError = error || hydrationError;

  const isLoading = loading || hydrating;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Factura de la reserva</h2>
          <p className="text-sm text-gray-500">Visualiza y descarga la factura sin salir del panel de gestion.</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            hasInvoiceNumber
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}
        >
          {hasInvoiceNumber
            ? `Factura #${
                reservation?._original?.invoice_number || reservation?.invoice_number || reservation?.invoiceNumber
              }`
            : 'Factura pendiente de emision'}
        </span>
      </div>

      {combinedError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">No pudimos cargar la factura</h3>
            <p className="text-sm">{combinedError}</p>
          </div>
        </div>
      )}

      {!combinedError && (
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600">Cargando plantilla de factura...</p>
            </div>
          )}

          <iframe
            ref={iframeRef}
            title="Factura de la reserva"
            src="/templates/InvoiceTemplate.html"
            className="w-full h-[1040px] bg-white"
          />
        </div>
      )}

      {!hasInvoiceNumber && !combinedError && (
        <div className="text-sm text-gray-500">
          Una vez se apruebe la reserva y se asigne un numero de factura podras generar el documento oficial con todos los
          datos.
        </div>
      )}
    </div>
  );
};

export default InvoiceViewTab;
