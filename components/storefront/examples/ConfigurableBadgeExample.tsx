"use client";

import { PromotionalBadge } from '../PromotionalBadge';
import { PromotionService } from '@/lib/storefront/promotion-service';

/**
 * Example component demonstrating configurable badge colors and text
 * This shows how vendors can customize their promotional badges
 */
export function ConfigurableBadgeExample() {
  // Get preset color schemes
  const presetSchemes = PromotionService.getPresetColorSchemes();

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Configurable Promotional Badges</h2>
      
      {/* Default badges with predefined colors */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Default Predefined Colors</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge discountPercentage={25} color="red" />
          <PromotionalBadge discountPercentage={30} color="green" />
          <PromotionalBadge discountPercentage={15} color="blue" />
          <PromotionalBadge discountPercentage={40} color="purple" />
        </div>
      </section>

      {/* Custom colors */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Custom Colors</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge 
            discountPercentage={25} 
            customColors={{
              background: '#ff6b6b',
              text: '#ffffff',
              border: '#ff5252'
            }}
          />
          <PromotionalBadge 
            discountPercentage={30} 
            customColors={{
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
              text: '#ffffff'
            }}
          />
          <PromotionalBadge 
            discountPercentage={50} 
            customColors={{
              background: '#2d3748',
              text: '#ffd700',
              border: '#ffd700'
            }}
          />
        </div>
      </section>

      {/* Custom text */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Custom Text</h3>
        <div className="flex flex-wrap gap-4">
          <PromotionalBadge 
            discountPercentage={25} 
            customText={{
              primary: 'MEGA SALE',
              secondary: 'Limited Time'
            }}
            customColors={presetSchemes.fire}
          />
          <PromotionalBadge 
            discountPercentage={30} 
            customText={{
              primary: 'Flash Deal',
              prefix: '⚡',
              suffix: '⚡'
            }}
            customColors={presetSchemes.ocean}
          />
          <PromotionalBadge 
            discountPercentage={40} 
            customText={{
              primary: 'VIP OFFER',
              secondary: 'Members Only'
            }}
            customColors={presetSchemes.gold}
          />
        </div>
      </section>

      {/* Different variants with custom styling */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Different Variants</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <PromotionalBadge 
            discountPercentage={25} 
            variant="minimal"
            customText={{ primary: 'HOT' }}
            customColors={presetSchemes.fire}
          />
          <PromotionalBadge 
            discountPercentage={30} 
            variant="compact"
            customText={{ secondary: 'FLASH SALE' }}
            customColors={presetSchemes.forest}
          />
          <PromotionalBadge 
            discountPercentage={40} 
            variant="savings"
            originalPrice={100}
            salePrice={60}
            customText={{
              primary: 'Special Price',
              secondary: 'You Save Big!',
              prefix: 'Was'
            }}
            customColors={presetSchemes.royal}
          />
        </div>
      </section>

      {/* Preset color schemes showcase */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Preset Color Schemes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(presetSchemes).map(([name, colors]) => (
            <div key={name} className="text-center">
              <PromotionalBadge 
                discountPercentage={25} 
                customColors={colors}
                customText={{ primary: name.toUpperCase() }}
                size="sm"
              />
              <p className="text-xs mt-2 capitalize">{name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration with promotion service */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Promotion Service Integration</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            Example of how the PromotionService converts promotion configurations to badge props:
          </p>
          <div className="flex flex-wrap gap-4">
            {/* This would typically come from your promotion data */}
            <PromotionalBadge 
              {...PromotionService.getPromotionalBadgeProps(
                {
                  id: 'example-promo',
                  vendorId: 'vendor-1',
                  type: 'storefront_wide',
                  title: 'Summer Sale',
                  description: 'Summer collection discount',
                  bannerMessage: 'Summer Sale Banner',
                  isActive: true,
                  startDate: new Date(),
                  endDate: new Date(),
                  displaySettings: {
                    backgroundColor: '#f59e0b',
                    textColor: '#ffffff',
                    position: 'top',
                    priority: 1,
                    showIcon: true,
                    customColors: presetSchemes.sunset,
                    customText: {
                      primary: 'SUMMER',
                      secondary: 'SALE',
                      prefix: '☀️',
                      suffix: '☀️'
                    },
                    badgeVariant: 'default'
                  }
                },
                25,
                100,
                75
              )}
            />
          </div>
        </div>
      </section>
    </div>
  );
}